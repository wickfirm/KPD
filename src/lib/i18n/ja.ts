import type { Translation } from "./en";

// Japanese. Generated from the translation sheet (KPD-translations-AR-JA.xlsx):
// every entry has a sheet row with exactly the English text of its key. Keys
// the sheet does not cover yet are left out, so English shows for them (see
// index.ts). All rows are drafts until the client's reviewers approve them.
const ja: Translation = {
  nav: {
    home: "ホーム",
    developments: "プロジェクト",
    about: "会社概要",
    history: "沿革",
    media: "メディア",
    news: "ニュース",
    investorGuide: "投資家ガイド",
    contact: "お問い合わせ",
    allDevelopments: "すべてのプロジェクト",
    viewAllDevelopments: "すべてのプロジェクトを見る",
    openMenu: "メニューを開く",
    closeMenu: "メニューを閉じる",
    backToNews: "ニュース一覧に戻る",
    language: "言語",
    enquireNow: "お問い合わせ",
  },
  footer: {
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    cookies: "クッキーポリシー",
    companyName: "霞ヶ関プロパティーズ・デベロップメント",
    developments: "プロジェクト",
    about: "会社概要",
    history: "沿革",
    investorGuide: "投資家ガイド",
    media: "メディア",
    news: "ニュース＆最新情報",
    contact: "お問い合わせ",
    newsletterHeading: "最新情報をお届けします",
  },
  news: {
    noArticles: "このカテゴリーの記事はまだありません。",
    showAll: "すべて表示",
    latest: "最新ニュース",
    inThePress: "掲載メディア",
  },
  home: {
    cardCta: "詳しく見る",
    contactCta: "来場を予約する",
    featuredDevelopments: "注目のプロジェクト",
  },
  about: {
    leadership: "経営陣",
  },
  legacy: {
    learnMore: "詳しく見る",
  },
  invest: {
    capCalculator: "住宅ローンシミュレーター",
    capPathway: "投資までの流れ",
    navFeatured: "プロジェクト",
    capFeatured: "注目のプロジェクト",
    eyebrow: "ドバイへの投資",
    heroCta: "アドバイザーに相談する",
  },
  dev: {
    startTour: "ツアーを始める",
    timeline: "スケジュール",
    milestone: "マイルストーン",
    bookViewing: "内覧を予約する",
    explore: "詳しく見る",
    overview: "概要",
    enquireHeading: "プライベート内覧の\nご予約。",
    enquireEyebrow: "お問い合わせ",
    enquireText: "間取り、価格、空き状況は、ご予約制の個別相談にてご案内します。",
    registerInterest: "資料請求・登録",
  },
  brochure: {
    download: "パンフレットをダウンロード",
    downloadFloorPlans: "間取り図をダウンロード",
    downloadPaymentPlan: "支払いプランをダウンロード",
    requestPlan: "間取り図を請求する",
  },
};

export default ja;
