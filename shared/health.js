const mongoose = require('mongoose');
const axios = require('axios');

class HealthChecker {
  constructor(serviceName, serviceConfig = {}) {
    this.serviceName = serviceName;
    this.serviceConfig = {
      checkDatabase: false,
      databaseUri: null,
      checkExternalApis: [],
      checkDependentServices: [],
      ...serviceConfig
    };
  }

  async checkDatabase() {
    if (!this.serviceConfig.checkDatabase || !this.serviceConfig.databaseUri) {
      return { status: 'skipped', message: 'Database check not configured' };
    }

    try {
      const dbState = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      if (dbState === 1) {
        return {
          status: 'healthy',
          message: 'Database connected',
          state: states[dbState]
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Database not connected',
          state: states[dbState]
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Database check failed',
        error: error.message
      };
    }
  }

  async checkExternalApis() {
    const results = [];

    for (const api of this.serviceConfig.checkExternalApis) {
      try {
        const startTime = Date.now();
        const response = await axios.get(api.url, {
          timeout: api.timeout || 5000,
          headers: api.headers || {}
        });
        const responseTime = Date.now() - startTime;

        results.push({
          name: api.name,
          url: api.url,
          status: response.status >= 200 && response.status < 300 ? 'healthy' : 'unhealthy',
          responseTime: `${responseTime}ms`,
          statusCode: response.status,
          message: response.status >= 200 && response.status < 300 ? 'OK' : 'API returned error status'
        });
      } catch (error) {
        results.push({
          name: api.name,
          url: api.url,
          status: 'unhealthy',
          message: error.message,
          error: error.code || 'CONNECTION_ERROR'
        });
      }
    }

    return results;
  }

  async checkDependentServices() {
    const results = [];

    for (const service of this.serviceConfig.checkDependentServices) {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${service.url}/health`, {
          timeout: service.timeout || 3000
        });
        const responseTime = Date.now() - startTime;

        results.push({
          name: service.name,
          url: service.url,
          status: response.status === 200 ? 'healthy' : 'unhealthy',
          responseTime: `${responseTime}ms`,
          statusCode: response.status,
          message: 'Service reachable'
        });
      } catch (error) {
        results.push({
          name: service.name,
          url: service.url,
          status: 'unhealthy',
          message: error.message,
          error: error.code || 'CONNECTION_ERROR'
        });
      }
    }

    return results;
  }

  getSystemInfo() {
    const usage = process.resourceUsage();
    const memUsage = process.memoryUsage();

    return {
      uptime: `${Math.floor(process.uptime())}s`,
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
      },
      cpu: {
        user: usage.userCPUTime,
        system: usage.systemCPUTime
      },
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development'
    };
  }

  async getHealthStatus() {
    const timestamp = new Date().toISOString();
    const systemInfo = this.getSystemInfo();

    const checks = {
      timestamp,
      service: this.serviceName,
      status: 'healthy',
      checks: {
        system: {
          status: 'healthy',
          info: systemInfo
        }
      },
      dependencies: {}
    };

    // Check database if configured
    if (this.serviceConfig.checkDatabase) {
      const dbCheck = await this.checkDatabase();
      checks.checks.database = dbCheck;
      if (dbCheck.status === 'unhealthy') {
        checks.status = 'degraded';
      }
    }

    // Check external APIs if configured
    if (this.serviceConfig.checkExternalApis.length > 0) {
      const apiChecks = await this.checkExternalApis();
      checks.dependencies.externalApis = apiChecks;
      const unhealthyApis = apiChecks.filter(api => api.status === 'unhealthy');
      if (unhealthyApis.length > 0) {
        checks.status = 'degraded';
      }
    }

    // Check dependent services if configured
    if (this.serviceConfig.checkDependentServices.length > 0) {
      const serviceChecks = await this.checkDependentServices();
      checks.dependencies.services = serviceChecks;
      const unhealthyServices = serviceChecks.filter(service => service.status === 'unhealthy');
      if (unhealthyServices.length > 0) {
        checks.status = 'degraded';
      }
    }

    return checks;
  }

  getLiveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      service: this.serviceName
    };
  }

  getReadiness() {
    const checks = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: this.serviceName
    };

    // Add custom readiness checks here if needed
    return checks;
  }
}

module.exports = HealthChecker;