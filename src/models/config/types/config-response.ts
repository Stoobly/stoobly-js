import { 
  FirewallAction, 
  MockPolicy, 
  ProxyMode, 
  RecordPolicy, 
  ReplayPolicy, 
  RequestParameter,
  TestPolicy, 
  TestStrategy 
} from '@constants/proxy';

import { HTTP_METHOD } from '.';

export interface AgentConfigResponse {
  cli: AgentCliSettings;
  proxy: AgentProxySettings;
  remote: AgentRemoteSettings;
  ui: AgentUISettings;
}

export interface AgentCliSettings {
  features: AgentFeatures;
}

export interface AgentFeatures {
  dev_tools: boolean;
  exec: boolean;
  remote: boolean;
}

export interface AgentProxySettings {
  data: {[projectId: string]: Partial<ProxyDataRules>};
  firewall: {[projectId: string]: ProxyFirewallRule[]};
  match: {[projectId: string]: ProxyMatchRule[]};
  rewrite: {[projectId: string]: ProxyRewriteRules[]};
  intercept: ProxyInterceptSettings;
  url: string;
}

export interface ProxyDataRules {
  mock_policy: MockPolicy;
  record_policy: RecordPolicy;
  replay_policy: ReplayPolicy;
  scenario_key?: string;
  test_policy: TestPolicy;
  test_strategy: TestStrategy;
}

export interface ProxyFirewallRule {
  action: FirewallAction;
  methods: HTTP_METHOD[];
  modes: ProxyMode[];
  pattern: string;
}

export interface ProxyMatchRule {
  components: RequestParameter[];
  methods: HTTP_METHOD[];
  modes: ProxyMode[];
  pattern: string;
}

export interface ProxyRewriteRules {
  methods: HTTP_METHOD[];
  pattern: string;
  parameters: ParameterRule;
}

export interface RewriteRule {
  methods: string[];
  pattern: string;
  parameter_rules: Array<ParameterRule>;
}

export interface Rewrite {
  type: RequestParameter;
  name: string;
  value: string;
}

export interface ParameterRule {
  type: RequestParameter;
  modes?: ProxyMode[];
  name: string;
  value?: string;
}

export interface ProxyInterceptSettings {
  active: boolean;
  mode: ProxyMode;
  project_key: string;
  scenario_key: string;
  upstream_url: string;
}

export interface AgentRemoteSettings {
  api_key: string;
  api_url: string;
}

export interface AgentUISettings {
  active: boolean;
  url: string;
}
