import {
  AgentCliSettings,
  AgentConfigResponse,
  AgentProxySettings,
  AgentRemoteSettings,
  AgentUISettings,
  ProxyDataRules,
  ProxyFilterRule,
  ProxyMatchRule,
  ProxyRewriteRules,
} from '../types/config-response';

export class AgentConfig {
  cli: AgentCliSettings;
  proxy: AgentProxySettings;
  remote: AgentRemoteSettings;
  ui: AgentUISettings;

  constructor(config: AgentConfigResponse) {
    this.cli = config.cli;
    this.proxy = config.proxy;
    this.remote = config.remote;
    this.ui = config.ui;
  }

  setApiKey(apiKey: string) {
    this.remote.api_key = apiKey;
  }

  setApiUrl(apiUrl: string) {
    this.remote.api_url = apiUrl;
  }

  getProjectId() {
    const projectKey = this.proxy.intercept.project_key;
    if (!projectKey || !projectKey.length) {
      return;
    }

    return this.decodeKey(projectKey)?.i;
  }

  setProject(projectKey: string) {
    this.proxy.intercept.project_key = projectKey.trim();
  }

  getScenario() {
    const projectId = this.getProjectId();
    if (projectId === undefined) return;

    const scenarioKey = this.proxy.data[projectId]?.scenario_key;
    if (!scenarioKey || !scenarioKey.length) {
      return;
    }

    return scenarioKey;
  }

  getScenarioId() {
    const scenarioKey = this.getScenario();
    if (!scenarioKey) {
      return;
    }

    return this.decodeKey(scenarioKey)?.i;
  }

  setScenario(scenarioKey: string) {
    const projectId = this.getProjectId();
    if (projectId === undefined) {
      return;
    }

    const proxyDataRules = this.getProxyDataRules(projectId);

    if (!proxyDataRules) {
      this.proxy.data[projectId] = {scenario_key: scenarioKey.trim()};
    } else {
      this.proxy.data[projectId].scenario_key = scenarioKey.trim();
    }
  }

  removeScenario() {
    const projectId = this.getProjectId();
    if (projectId === undefined) {
      return;
    }
    const proxyDataRules = this.getProxyDataRules(projectId);
    proxyDataRules.scenario_key = ''; // Opposed to deleting the key, setting to empty because config is merged
  }

  setProxyDataRules(projectId: number, data: Partial<ProxyDataRules>) {
    const dataSettings = this.proxy.data;
    dataSettings[projectId] = {...dataSettings[projectId], ...data};
  }

  getProxyDataRules(projectId: number) {
    const dataSettings = this.proxy.data;
    return dataSettings[projectId] || {};
  }

  setProxyFilterRules(projectId: number, data: ProxyFilterRule[]) {
    const filterSettings = this.proxy.filter;
    return (filterSettings[projectId] = data);
  }

  getProxyFilterRules(projectId: number) {
    const filterSettings = this.proxy.filter;
    return filterSettings[projectId];
  }

  setProxyMatchRules(projectId: number, data: ProxyMatchRule[]) {
    const matchSettings = this.proxy.match;
    return (matchSettings[projectId] = data);
  }

  getProxyMatchRules(projectId: number) {
    const matchSettings = this.proxy.match;
    return matchSettings[projectId];
  }

  setProxyRewriteRules(projectId: number, data: ProxyRewriteRules[]) {
    const RewriteRules = this.proxy.rewrite;
    return (RewriteRules[projectId] = data);
  }

  getProxyRewriteRules(projectId: number) {
    const RewriteRules = this.proxy.rewrite;
    return RewriteRules[projectId];
  }

  toHash() {
    const {cli, proxy, remote, ui} = this;
    return {
      cli,
      proxy,
      remote,
      ui,
    };
  }

  // Helpers

  private decodeKey(key: string): {i: number} | undefined {
    try {
      return JSON.parse(atob(key));
    } catch (e) {
      return undefined;
    }
  }
}
