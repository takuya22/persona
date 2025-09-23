# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from google.adk.agents.parallel_agent import ParallelAgent
from google.adk.agents.llm_agent import LlmAgent
from google.adk.agents.sequential_agent import SequentialAgent
from google.adk.runners import InMemoryRunner
from google.genai import types

from .reviewers import ALL_REVIEWERS

# --- Configuration ---
APP_NAME = "persona_review_app_20"
USER_ID = "review_user_01"
SESSION_ID = "persona_review_session_20"
GEMINI_MODEL = "gemini-2.0-flash"

# --- Create the ParallelAgent (Runs all 20 reviewers concurrently) ---
parallel_review_agent = ParallelAgent(
    name="Parallel20PersonaReviewAgent",
    sub_agents=[
        ALL_REVIEWERS[0], ALL_REVIEWERS[1], ALL_REVIEWERS[2], ALL_REVIEWERS[3], ALL_REVIEWERS[4],
        ALL_REVIEWERS[5], ALL_REVIEWERS[6], ALL_REVIEWERS[7], ALL_REVIEWERS[8], ALL_REVIEWERS[9]
    ],
    description="20の多様なペルソナによる並列レビュー分析を実行"
)

# --- Define the Synthesis Agent ---
synthesis_agent = LlmAgent(
    name="ReviewSynthesisAgent",
    model=GEMINI_MODEL,
    instruction="""あなたは20の多様なペルソナレビューを統合するAIアシスタントです。

**20のペルソナレビュー:**
1. 彩香（Webデザイナー）: {review_1}
2. 健太（IT会社員）: {review_2}
3. 美咲（主婦）: {review_3}
4. 太郎（中間管理職）: {review_4}
5. 花子（看護師）: {review_5}
6. 雅人（経営者）: {review_6}
7. 麻衣（大学院生）: {review_7}
8. 秀樹（教師）: {review_8}
9. 聡子（公務員）: {review_9}
10. 拓也（スタートアップ）: {review_10}
11. 恵美（シニア）: {review_11}
12. 慎一（フリーランスエンジニア）: {review_12}
13. 由紀（アパレル店員）: {review_13}
14. 隆志（営業部長）: {review_14}
15. 理恵（薬剤師）: {review_15}
16. 雄介（アーティスト）: {review_16}
17. 明子（介護士）: {review_17}
18. 直樹（銀行員）: {review_18}
19. 純子（保育士）: {review_19}
20. 健（建設業）: {review_20}

**出力フォーマット:**

## 【20ペルソナ総合レビュー分析】

### 評価分布
- **★5**: [該当するペルソナ名]
- **★4**: [該当するペルソナ名]
- **★3**: [該当するペルソナ名]
- **★2**: [該当するペルソナ名]
- **★1**: [該当するペルソナ名]

### 属性別評価傾向
- **年代別**: 20代/30代/40代/50代/60代の評価傾向
- **職業別**: 専門職/事務職/技術職/サービス業/その他の評価傾向
- **生活スタイル別**: 単身/夫婦/ファミリーの評価傾向

### 高評価された要素
[多くのペルソナが評価したポジティブポイント]

### 課題として指摘された要素
[複数のペルソナが指摘したネガティブポイント]

### ターゲット別推奨度
- **最適**: [特に高評価だったペルソナ層の特徴]
- **適合**: [まあまあ評価だったペルソナ層の特徴]  
- **要検討**: [低評価だったペルソナ層の特徴]

### 総合評価
**★[1-5の総合評価] / 5** (平均値: [数値])
[20のレビューを統合した総合的な評価理由を3-4文で]

提供された20のレビュー内容のみに基づいて分析し、多様性を活かした包括的で客観的な統合評価を作成してください。
""",
    description="20ペルソナのレビューを統合し多角的総合評価を作成",
)

# --- Create the SequentialAgent ---
sequential_review_pipeline = SequentialAgent(
    name="PersonaReview20Pipeline",
    sub_agents=[parallel_review_agent, synthesis_agent],
    description="20ペルソナレビューと統合分析のパイプライン"
)

root_agent = sequential_review_pipeline
# --8<-- [end:init]

# # --- Usage Function ---
# def run_20persona_review(review_content):
#     """
#     20ペルソナレビューシステムを実行する関数
    
#     Args:
#         review_content (str): レビューしたい内容（商品、サービス、アイデアなど）
    
#     Returns:
#         str: 統合されたレビュー結果
#     """
#     runner = InMemoryRunner()
    
#     result = runner.run(
#         agent=root_agent,
#         user_message=review_content,
#         app_name=APP_NAME,
#         user_id=USER_ID,
#         session_id=SESSION_ID
#     )
    
#     return result

# # --- Example Usage ---
# if __name__ == "__main__":
#     # 使用例：新サービスのレビュー
#     sample_content = """
#     **サービス名**: QuickMeal - AI料理提案アプリ
#     **価格**: 月額980円
#     **概要**: 
#     - 冷蔵庫の食材をカメラで撮影するだけでAIが料理を提案
#     - 栄養バランスと家族の好みを学習して最適化
#     - 買い物リスト自動生成機能付き
#     - 調理手順を音声でガイド
#     - 食材の消費期限管理機能
#     """
    
#     # 20ペルソナレビュー実行
#     result = run_20persona_review(sample_content)
#     print(result)