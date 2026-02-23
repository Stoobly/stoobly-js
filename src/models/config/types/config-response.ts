import { 
  FirewallAction, 
  MockPolicy, 
  InterceptMode, 
  RecordPolicy, 
  ReplayPolicy, 
  RequestParameter,
  TestPolicy, 
  TestStrategy 
} from '@constants/intercept';

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

export interface MatchRule {
  modes: InterceptMode[];
  components: RequestParameter;
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
  modes: InterceptMode[];
  pattern: string;
}

export interface ProxyMatchRule {
  components: RequestParameter[];
  methods: HTTP_METHOD[];
  modes: InterceptMode[];
  pattern: string;
}

export interface ProxyRewriteRules extends RewriteRule {
  methods: HTTP_METHOD[];
  pattern: string;
}

export interface ParameterRule {
  type: RequestParameter;
  modes?: InterceptMode[];
  name: string;
  value?: string;
}

export interface ProxyInterceptSettings {
  active: boolean;
  mode: InterceptMode;
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

export interface RewriteRule {
  urlRules?: UrlRule[];
  parameterRules?: ParameterRule[];
}

export interface UrlRule {
  modes?: InterceptMode[];
  path?: string;
  port?: string;
  scheme?: string;
}