import vertexai
from vertexai import agent_engines
from agent import root_agent

PROJECT_ID = "persona-472007"
LOCATION   = "us-central1"          # 提供リージョンを使用
STAGING    = "gs://persona-agent-session"         # 事前に作成

vertexai.init(project=PROJECT_ID, location=LOCATION, staging_bucket=STAGING)

# ADK エージェントを Agent Engine 用にラップ
app = agent_engines.AdkApp(agent=root_agent, enable_tracing=True)

# デプロイ（requirements は最小でOK。必要に応じて追加）
remote = agent_engines.create(
    agent_engine=app,
    requirements=[
        "google-cloud-aiplatform[adk,agent_engines]"
    ],
)

print("Deployed:", remote.resource_name)
# 形式: projects/{PROJECT_NUMBER}/locations/{LOCATION}/reasoningEngines/{ENGINE_ID}