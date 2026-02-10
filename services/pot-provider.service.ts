import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

interface POTProviderHealth {
  status: 'healthy' | 'unhealthy' | 'starting';
  port: number;
  uptime?: number;
  startTime?: number;
  restartCount?: number;
}

class POTProviderService {
  private process: ChildProcess | null = null;
  private port: number = 4416;
  private startTime: number = 0;
  private restartCount: number = 0;
  private maxRestarts: number = 3;
  private restartWindow: number = 60000;
  private lastRestartTime: number = 0;
  private isShuttingDown: boolean = false;

  async start(): Promise<void> {
    if (this.process) {
      console.log('[POT] Server already running');
      return;
    }

    if (!this.canRestart()) {
      console.error('[POT] Max restart attempts reached');
      return;
    }

    const binPath = join(process.cwd(), 'bin', 'bgutil-pot');

    if (!existsSync(binPath)) {
      console.error(`[POT] Binary not found at ${binPath}`);
      return;
    }

    console.log('[POT] Starting POT provider server...');
    this.startTime = Date.now();

    try {
      this.process = spawn(binPath, ['server', '--port', this.port.toString()], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });

      this.process.stdout?.on('data', (data) => {
        console.log(`[POT] ${data.toString().trim()}`);
      });

      this.process.stderr?.on('data', (data) => {
        console.error(`[POT] Error: ${data.toString().trim()}`);
      });

      this.process.on('error', (err) => {
        console.error('[POT] Process error:', err);
        this.handleProcessExit();
      });

      this.process.on('exit', (code) => {
        console.log(`[POT] Server exited with code ${code}`);
        this.handleProcessExit();
      });

      await this.waitForHealthCheck(5000);
      console.log('[POT] Server started successfully on port', this.port);
    } catch (error) {
      console.error('[POT] Failed to start server:', error);
      this.process = null;
    }
  }

  stop(): void {
    this.isShuttingDown = true;

    if (this.process) {
      console.log('[POT] Stopping POT provider server...');
      this.process.kill('SIGTERM');

      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL');
        }
      }, 3000);

      this.process = null;
    }
  }

  async getHealth(): Promise<POTProviderHealth> {
    if (!this.process || this.process.killed) {
      return {
        status: 'unhealthy',
        port: this.port,
      };
    }

    try {
      const response = await fetch(`http://127.0.0.1:${this.port}/ping`);
      const uptime = Date.now() - this.startTime;

      if (response.ok) {
        return {
          status: 'healthy',
          port: this.port,
          uptime,
          startTime: this.startTime,
          restartCount: this.restartCount,
        };
      } else {
        return {
          status: 'unhealthy',
          port: this.port,
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        port: this.port,
      };
    }
  }

  private async waitForHealthCheck(timeout: number): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`http://127.0.0.1:${this.port}/ping`, {
          signal: AbortSignal.timeout(1000),
        });

        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Server not ready yet
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return false;
  }

  private handleProcessExit(): void {
    this.process = null;

    if (this.isShuttingDown) {
      return;
    }

    if (this.canRestart()) {
      console.log('[POT] Attempting to restart server...');
      this.restartCount++;
      this.lastRestartTime = Date.now();
      this.start();
    } else {
      console.error('[POT] Max restart attempts exceeded');
    }
  }

  private canRestart(): boolean {
    const timeSinceLastRestart = Date.now() - this.lastRestartTime;

    if (timeSinceLastRestart > this.restartWindow) {
      this.restartCount = 0;
      return true;
    }

    return this.restartCount < this.maxRestarts;
  }

  async test(): Promise<boolean> {
    const health = await this.getHealth();

    if (health.status !== 'healthy') {
      console.error('[POT] Health check failed');
      return false;
    }

    try {
      const response = await fetch(`http://127.0.0.1:${this.port}/get_pot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        console.log('[POT] Token generation test passed');
        return true;
      }
    } catch (error) {
      console.error('[POT] Token generation test failed:', error);
    }

    return false;
  }
}

export const potProviderService = new POTProviderService();

process.on('exit', () => {
  potProviderService.stop();
});
