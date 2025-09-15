# MindfulReplay

YouTube動画での学習を支援するモダンなWebアプリケーション。動画保存、メモ作成、タスク管理機能を提供します。

## ✨ 特徴

- 📹 **動画管理**: YouTube学習動画の保存と整理
- 📝 **スマートメモ**: タイムスタンプ付きメモとテンプレート機能
- 🎯 **タスク管理**: メモから実行可能なタスクへの変換
- ⏱️ **タイムスタンプナビゲーション**: クリックで動画の特定位置にジャンプ
- 📱 **PWA対応**: オフライン機能とアプリインストール
- 🎨 **モダンUI**: Tailwind CSSによるレスポンシブデザイン
- 🔐 **認証システム**: NextAuth.js統合（デモモード対応）

## 🚀 技術スタック

- **フロントエンド**: Next.js 15, React 18, TypeScript
- **スタイリング**: Tailwind CSS
- **バックエンド**: Next.js App Router API Routes
- **データベース**: Prisma ORM + PlanetScale (MySQL)
- **認証**: NextAuth.js
- **動画プレイヤー**: YouTube IFrame API
- **PWA**: Service Worker + Workbox
- **デプロイ**: Vercel

## 🛠 セットアップ

### 前提条件

- Node.js 18+
- npm または yarn

### インストール

1. リポジトリをクローン:
```bash
git clone <repository-url>
cd web
```

2. 依存関係をインストール:
```bash
npm install
```

3. 環境変数を設定:
```bash
cp .env.example .env.local
```

`.env.local` を編集:
```
# データベース（オプション - 設定しない場合はモックデータを使用）
DATABASE_URL=mysql://user:pass@host:port/database

# 認証（オプション - 設定しない場合はデモモードを使用）
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# YouTube API（オプション - 設定しない場合はモックデータを使用）
YOUTUBE_API_KEY=your-youtube-api-key

# 開発設定
NODE_ENV=development
USE_MOCK_DATA=true
```

4. 開発サーバーを起動:
```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリを確認できます。

## 🎯 デモモード

アプリはデフォルトでデモモードで動作し、以下の機能を提供します：
- モックユーザー認証
- サンプル動画データ
- ローカルストレージでの永続化
- 全機能が完全に動作

## 📡 API エンドポイント

### 動画関連
- `GET /api/videos` - 保存された動画の一覧取得
- `POST /api/videos` - 新しい動画の保存
- `GET /api/preview-video` - YouTube URLからの動画メタデータ取得

### メモ関連
- `GET /api/memos` - メモの一覧取得
- `POST /api/memos` - 新しいメモの作成
- `GET /api/memos/[id]` - メモの詳細取得
- `PUT /api/memos/[id]` - メモの更新
- `DELETE /api/memos/[id]` - メモの削除

### タスク関連
- `GET /api/tasks` - タスクの一覧取得
- `POST /api/tasks` - 新しいタスクの作成
- `POST /api/memos/[id]/tasks` - メモからタスクの作成
- `PUT /api/tasks/[id]` - タスクの更新
- `DELETE /api/tasks/[id]` - タスクの削除

### その他
- `GET /api/health` - ヘルスチェック
- `GET /api/auth/[...nextauth]` - 認証エンドポイント

## 🚀 デプロイ

### Vercel（推奨）

1. Vercel CLIをインストール:
```bash
npm i -g vercel
```

2. デプロイ:
```bash
vercel
```

3. Vercelダッシュボードで環境変数を設定:
   - `DATABASE_URL` (オプション)
   - `NEXTAUTH_URL` (本番URL)
   - `NEXTAUTH_SECRET` (本番用シークレット)
   - `YOUTUBE_API_KEY` (オプション)
   - `USE_MOCK_DATA=false` (本番環境の場合)

### マニュアルビルド

```bash
npm run build
npm start
```

## 📁 プロジェクト構造

```
src/
├── app/                      # Next.js App Router
│   ├── api/                 # API ルート
│   │   ├── auth/           # 認証関連API
│   │   ├── videos/         # 動画管理API
│   │   ├── memos/          # メモ管理API
│   │   └── tasks/          # タスク管理API
│   ├── memos/              # メモページ
│   ├── tasks/              # タスクページ
│   ├── watch/              # 動画視聴ページ
│   └── offline/            # オフラインページ
├── components/              # Reactコンポーネント
│   ├── memo/               # メモ関連コンポーネント
│   └── video/              # 動画関連コンポーネント
├── lib/                    # ユーティリティと設定
│   ├── auth.ts            # 認証設定
│   ├── database.ts        # データベース設定
│   ├── prisma.ts          # Prismaクライアント
│   └── utils.ts           # ユーティリティ関数
└── types/                  # TypeScript型定義
```

## 🎨 主要機能詳細

### 動画管理
- YouTube URLからの動画保存
- 自動メタデータ取得
- サムネイル付きグリッドビュー
- 動画時間とチャンネル情報表示

### メモシステム
- 4つのメモタイプ（洞察、アクション、質問、要約）
- 重要度レーティング（1-5段階）
- タイムスタンプ統合
- メモ内クリック可能タイムスタンプ

### タスク管理
- メモからタスクへの変換
- 優先度とステータス管理
- 期日設定と進捗追跡
- 関連メモとの連携

### PWA機能
- オフライン対応
- アプリインストール
- バックグラウンド同期
- インテリジェントキャッシング

## 🔧 設定オプション

### データベース設定（オプション）

1. PlanetScaleデータベースを作成
2. `DATABASE_URL`を環境変数に設定
3. マイグレーション実行:
```bash
npx prisma db push
```

### YouTube API設定（オプション）

1. Google Cloud ConsoleでYouTube Data API v3を有効化
2. APIキーを取得
3. `YOUTUBE_API_KEY`を環境変数に設定

## 🤝 コントリビューション

1. リポジトリをフォーク
2. フィーチャーブランチを作成: `git checkout -b feature/new-feature`
3. 変更をコミット: `git commit -am 'Add new feature'`
4. ブランチにプッシュ: `git push origin feature/new-feature`
5. プルリクエストを送信

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🙏 謝辞

- Next.jsチーム - 優れたフレームワークの提供
- Vercel - ホスティングとデプロイプラットフォームの提供
- PlanetScale - データベースソリューションの提供
- YouTube - 動画プラットフォーム統合の提供

---

❤️ Next.jsとTypeScriptで構築
