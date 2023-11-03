export interface TiktokApi {
  AppContext: AppContext
  BizContext: BizContext
  SEOState: Seostate
  ItemList: ItemList
  ItemModule: ItemModule
  UserModule: UserModule
  VideoPage: VideoPage
  SharingMetaState: SharingMetaState
}

export interface AppContext {
  appContext: AppContext2
  initialized: boolean
  lang: string
  sideNavActive: boolean
}

export interface AppContext2 {
  language: string
  region: string
  appId: number
  appType: string
  wid: string
  webIdCreatedTime: string
  odinId: string
  nonce: string
  botType: string
  requestId: string
  clusterRegion: string
  abTestVersion: AbTestVersion
  csrfToken: string
  userAgent: string
  encryptedWebid: string
  host: string
}

export interface AbTestVersion {
  versionName: string
  parameters: Parameters
}

export interface Parameters {
  has_system_notification_inbox: HasSystemNotificationInbox
  should_highlight_hashtag: ShouldHighlightHashtag
  login_modal_ui_revamp: LoginModalUiRevamp
  video_feed_redesign: VideoFeedRedesign
  use_follow_v2: UseFollowV2
  creator_center_connect: CreatorCenterConnect
  one_column_player_size: OneColumnPlayerSize
  mobile_consumption_limit_non_logged_in: MobileConsumptionLimitNonLoggedIn
  enable_odin_id: EnableOdinId
  qr_sso_popup: QrSsoPopup
  webapp_login_email_phone: WebappLoginEmailPhone
  xgplayer_preload_config: XgplayerPreloadConfig
  use_inbox_notice_count_api: UseInboxNoticeCountApi
  mobile_search_test: MobileSearchTest
  browser_mode_creator_tab_3: BrowserModeCreatorTab3
  xg_volume_test: XgVolumeTest
  has_system_notification_inbox_mobile: HasSystemNotificationInboxMobile
  seo_footer_navigation: SeoFooterNavigation
  mobile_vodkit: MobileVodkit
  sign_up_webapp_region_change: SignUpWebappRegionChange
  browser_login_redirect: BrowserLoginRedirect
  periodic_login_popup_interval: PeriodicLoginPopupInterval
  confirm_logout: ConfirmLogout
  volume_normalize: VolumeNormalize
  webapp_switch_account: WebappSwitchAccount
  browser_mode_encourage_login: BrowserModeEncourageLogin
  login_option_order_by_metrics: LoginOptionOrderByMetrics
  studio_web_eh_entrance: StudioWebEhEntrance
  search_video: SearchVideo
  mobile_consumption_limit_logged_in: MobileConsumptionLimitLoggedIn
  webapp_guest_mode: WebappGuestMode
  profile_ui_opt: ProfileUiOpt
  share_button_part1_test: ShareButtonPart1Test
  seo_navigation_switch: SeoNavigationSwitch
  video_serverpush: VideoServerpush
  enable_ml_model: EnableMlModel
  video_bitrate_adapt: VideoBitrateAdapt
  mobile_consumption_limit_v2: MobileConsumptionLimitV2
  add_info_card: AddInfoCard
  add_kap_entry: AddKapEntry
  browse_mode_autoplay_test: BrowseModeAutoplayTest
  comment_refactor_test: CommentRefactorTest
  creator_center_connect_global: CreatorCenterConnectGlobal
  creator_center_test: CreatorCenterTest
  desktop_ui_opt: DesktopUiOpt
  desktop_ui_reply: DesktopUiReply
  enable_fb_sdk: EnableFbSdk
  enable_profile_pinned_video: EnableProfilePinnedVideo
  enhance_video_consumption_test: EnhanceVideoConsumptionTest
  explore_test: ExploreTest
  favorite_test: FavoriteTest
  fix_tea_session: FixTeaSession
  increase_detail_page_cover_quantity_test: IncreaseDetailPageCoverQuantityTest
  kep_new_ui_login: KepNewUiLogin
  kep_video_sort_ctr_exp: KepVideoSortCtrExp
  kep_videos: KepVideos
  live_abr_version: LiveAbrVersion
  live_end_improved_metrics: LiveEndImprovedMetrics
  live_feed_style: LiveFeedStyle
  live_golive_entrance: LiveGoliveEntrance
  live_lcp_perf_optimize: LiveLcpPerfOptimize
  live_player_h265: LivePlayerH265
  live_player_handler: LivePlayerHandler
  live_player_icon: LivePlayerIcon
  live_player_mute_text: LivePlayerMuteText
  live_player_switch_button: LivePlayerSwitchButton
  live_preview_web: LivePreviewWeb
  live_pro_show: LiveProShow
  live_public_screen_skeleton: LivePublicScreenSkeleton
  live_recharge_by_amount: LiveRechargeByAmount
  live_recharge_login: LiveRechargeLogin
  live_room_age_restriction: LiveRoomAgeRestriction
  live_room_gift_version: LiveRoomGiftVersion
  live_studio_download_refactor_pc: LiveStudioDownloadRefactorPc
  live_top_viewers: LiveTopViewers
  muse_pc_web: MusePcWeb
  muse_web: MuseWeb
  non_personalized_feeds_web: NonPersonalizedFeedsWeb
  oeac_aa: OeacAa
  optimise_browser_mode: OptimiseBrowserMode
  pc_video_playlist_test: PcVideoPlaylistTest
  photo_test: PhotoTest
  profile_follow_info: ProfileFollowInfo
  search_add_live: SearchAddLive
  search_add_non_personalized_switch: SearchAddNonPersonalizedSwitch
  search_add_related_search: SearchAddRelatedSearch
  search_bar_style_opt: SearchBarStyleOpt
  search_entry_comment_top: SearchEntryCommentTop
  search_entry_comment_word: SearchEntryCommentWord
  search_entry_search_bar: SearchEntrySearchBar
  search_keep_sug_show: SearchKeepSugShow
  search_transfer_history: SearchTransferHistory
  search_video_lab: SearchVideoLab
  seo_breadcrumb_detail: SeoBreadcrumbDetail
  sidenav_test: SidenavTest
  tiktok: Tiktok
  ttlive_broadcast_topic_version_two: TtliveBroadcastTopicVersionTwo
  ui_layout_alignment: UiLayoutAlignment
  use_error_boundary: UseErrorBoundary
  video_detail_search_bar: VideoDetailSearchBar
  webapp_explore_category: WebappExploreCategory
  webapp_preview_cover: WebappPreviewCover
  webapp_recommend_language: WebappRecommendLanguage
  webapp_video_detail_page_related_mask: WebappVideoDetailPageRelatedMask
  webcast: Webcast
}

export interface HasSystemNotificationInbox {
  vid: string
}

export interface ShouldHighlightHashtag {
  vid: string
}

export interface LoginModalUiRevamp {
  vid: string
}

export interface VideoFeedRedesign {
  vid: string
}

export interface UseFollowV2 {
  vid: string
}

export interface CreatorCenterConnect {
  vid: string
}

export interface OneColumnPlayerSize {
  vid: string
}

export interface MobileConsumptionLimitNonLoggedIn {
  vid: string
}

export interface EnableOdinId {
  vid: string
}

export interface QrSsoPopup {
  vid: string
}

export interface WebappLoginEmailPhone {
  vid: string
}

export interface XgplayerPreloadConfig {
  vid: string
}

export interface UseInboxNoticeCountApi {
  vid: string
}

export interface MobileSearchTest {
  vid: string
}

export interface BrowserModeCreatorTab3 {
  vid: string
}

export interface XgVolumeTest {
  vid: string
}

export interface HasSystemNotificationInboxMobile {
  vid: string
}

export interface SeoFooterNavigation {
  vid: string
}

export interface MobileVodkit {
  vid: string
}

export interface SignUpWebappRegionChange {
  vid: string
}

export interface BrowserLoginRedirect {
  vid: string
}

export interface PeriodicLoginPopupInterval {
  vid: string
}

export interface ConfirmLogout {
  vid: string
}

export interface VolumeNormalize {
  vid: string
}

export interface WebappSwitchAccount {
  vid: string
}

export interface BrowserModeEncourageLogin {
  vid: string
}

export interface LoginOptionOrderByMetrics {
  vid: string
}

export interface StudioWebEhEntrance {
  vid: string
}

export interface SearchVideo {
  vid: string
}

export interface MobileConsumptionLimitLoggedIn {
  vid: string
}

export interface WebappGuestMode {
  vid: string
}

export interface ProfileUiOpt {
  vid: string
}

export interface ShareButtonPart1Test {
  vid: string
}

export interface SeoNavigationSwitch {
  vid: string
}

export interface VideoServerpush {
  vid: string
}

export interface EnableMlModel {
  vid: string
}

export interface VideoBitrateAdapt {
  vid: string
}

export interface MobileConsumptionLimitV2 {
  vid: string
}

export interface AddInfoCard {
  vid: string
}

export interface AddKapEntry {
  vid: string
}

export interface BrowseModeAutoplayTest {
  vid: string
}

export interface CommentRefactorTest {
  vid: string
}

export interface CreatorCenterConnectGlobal {
  vid: string
}

export interface CreatorCenterTest {
  vid: string
}

export interface DesktopUiOpt {
  vid: string
}

export interface DesktopUiReply {
  vid: string
}

export interface EnableFbSdk {
  vid: string
}

export interface EnableProfilePinnedVideo {
  vid: string
}

export interface EnhanceVideoConsumptionTest {
  vid: string
}

export interface ExploreTest {
  vid: string
}

export interface FavoriteTest {
  vid: string
}

export interface FixTeaSession {
  vid: string
}

export interface IncreaseDetailPageCoverQuantityTest {
  vid: string
}

export interface KepNewUiLogin {
  vid: string
}

export interface KepVideoSortCtrExp {
  vid: string
}

export interface KepVideos {
  predict_params: PredictParams
}

export interface PredictParams {
  consts: Consts
  formulas: Formulas
  dump_params_allowlist: DumpParamsAllowlist
}

export interface Consts {
  kep_search_score_final: string
  kep_search_score_ctr: string
}

export interface Formulas {
  root: string
}

export interface DumpParamsAllowlist {
  ab_vt_allowlist: AbVtAllowlist
}

export interface AbVtAllowlist {
  kep_ctr_params: string[]
}

export interface LiveAbrVersion {
  vid: string
}

export interface LiveEndImprovedMetrics {
  vid: string
}

export interface LiveFeedStyle {
  vid: string
}

export interface LiveGoliveEntrance {
  vid: string
}

export interface LiveLcpPerfOptimize {
  vid: string
}

export interface LivePlayerH265 {
  vid: string
}

export interface LivePlayerHandler {
  vid: string
}

export interface LivePlayerIcon {
  vid: string
}

export interface LivePlayerMuteText {
  vid: string
}

export interface LivePlayerSwitchButton {
  vid: string
}

export interface LivePreviewWeb {
  vid: string
}

export interface LiveProShow {
  vid: string
}

export interface LivePublicScreenSkeleton {
  vid: string
}

export interface LiveRechargeByAmount {
  vid: string
}

export interface LiveRechargeLogin {
  vid: string
}

export interface LiveRoomAgeRestriction {
  vid: string
}

export interface LiveRoomGiftVersion {
  vid: string
}

export interface LiveStudioDownloadRefactorPc {
  vid: string
}

export interface LiveTopViewers {
  vid: string
}

export interface MusePcWeb {
  predict_params: PredictParams2
}

export interface PredictParams2 {
  consts: Consts2
  formulas: Formulas2
}

export interface Consts2 {
  group_like_count: string
  group_comment_count: string
  group_follow_cnt: string
}

export interface Formulas2 {
  combine_score: string
  ab_slot_1: string
}

export interface MuseWeb {
  predict_params: PredictParams3
}

export interface PredictParams3 {
  consts: Consts3
  formulas: Formulas3
}

export interface Consts3 {
  group_like_count: string
  group_comment_count: string
  group_follow_cnt: string
}

export interface Formulas3 {
  combine_score: string
  ab_slot_1: string
}

export interface NonPersonalizedFeedsWeb {
  vid: string
}

export interface OeacAa {
  vid: string
}

export interface OptimiseBrowserMode {
  vid: string
}

export interface PcVideoPlaylistTest {
  vid: string
}

export interface PhotoTest {
  vid: string
}

export interface ProfileFollowInfo {
  vid: string
}

export interface SearchAddLive {
  vid: string
}

export interface SearchAddNonPersonalizedSwitch {
  vid: string
}

export interface SearchAddRelatedSearch {
  vid: string
}

export interface SearchBarStyleOpt {
  vid: string
}

export interface SearchEntryCommentTop {
  vid: string
}

export interface SearchEntryCommentWord {
  vid: string
}

export interface SearchEntrySearchBar {
  vid: string
}

export interface SearchKeepSugShow {
  vid: string
}

export interface SearchTransferHistory {
  vid: string
}

export interface SearchVideoLab {
  vid: string
}

export interface SeoBreadcrumbDetail {
  vid: string
}

export interface SidenavTest {
  vid: string
}

export interface Tiktok {
  private_account_prompt_for_u18: number
}

export interface TtliveBroadcastTopicVersionTwo {
  vid: string
}

export interface UiLayoutAlignment {
  vid: string
}

export interface UseErrorBoundary {
  vid: string
}

export interface VideoDetailSearchBar {
  vid: string
}

export interface WebappExploreCategory {
  vid: string
}

export interface WebappPreviewCover {
  vid: string
}

export interface WebappRecommendLanguage {
  vid: string
}

export interface WebappVideoDetailPageRelatedMask {
  vid: string
}

export interface Webcast {
  web_follow_guide_strategy_group: number
}

export interface BizContext {
  bizContext: BizContext2
  initialized: boolean
}

export interface BizContext2 {
  os: string
  isMobile: boolean
  isAndroid: boolean
  isIOS: boolean
  jumpType: string
  navList: NavList[]
  kapLinks: KapLink[]
  config: Config
  domains: Domains
  downloadLink: DownloadLink
  deviceLimitRegisterExpired: boolean
  subdivisions: string[]
  geo: string[]
  geoCity: GeoCity
  isGoogleBot: boolean
  isBingBot: boolean
  isBot: boolean
  isSearchEngineBot: boolean
  isTTP: boolean
  dateFmtLocale: DateFmtLocale
  videoPlayerConfig: VideoPlayerConfig
  playbackNormalizePath: PlaybackNormalizePath
  bitrateConfig: BitrateConfig
  searchVideoForLoggedin: boolean
  studioDownloadEntrance: StudioDownloadEntrance
  liveSuggestConfig: LiveSuggestConfig
  liveAnchorEntrance: LiveAnchorEntrance
  liveStudioEnable: boolean
  xgplayerInitHost: XgplayerInitHost
  videoOrder: VideoOrder
  searchLiveForLoggedin: boolean
  canUseQuery: boolean
  bitrateSelectorConfigs: BitrateSelectorConfigs
  idc: string
  videoCoverSettings: VideoCoverSettings
  hevcRobustness: HevcRobustness
  apiKeys: ApiKeys
}

export interface NavList {
  title: string
  children: Children[]
}

export interface Children {
  title: string
  href: string
  key?: string
}

export interface KapLink {
  title: string
  children: Children2[]
}

export interface Children2 {
  lang: string[]
  links: Link[]
}

export interface Link {
  title: string
  href: string
}

export interface Config {
  featureFlags: FeatureFlags
  desktopAppDownloadLink: DesktopAppDownloadLink
  signUpOpen: boolean
  cookieBanner: CookieBanner
  isGrayFilter: boolean
  nickNameControlDay: string
  desktopAppSurveyLink: DesktopAppSurveyLink
}

export interface FeatureFlags {
  feature_bar: boolean
  business_account_open: boolean
  feature_tt4b_ads: boolean
  support_multiline_desc: boolean
  pc_video_playlist: boolean
  feature_mobile_ui_opt_stage2: boolean
  add_recipe_card: boolean
}

export interface DesktopAppDownloadLink {
  mac: string
  win: string
}

export interface CookieBanner {
  load_dynamically: boolean
  decline_btn_staged_rollout_area: string[]
  resource: Resource
  i18n: I18n
}

export interface Resource {
  prefix: string
  themes: string[]
  esm: string
  nomodule: string
  version: string
}

export interface I18n {
  cookieBannerTitle: string
  cookieBannerTitleNew: string
  cookieBannerSubTitle: string
  cookieBannerSubTitleNew: string
  cookieBannerSubTitleV2: string
  cookieBannerBtnManage: string
  cookieBannerBtnAccept: string
  cookieBannerBtnDecline: string
  cookiesBannerDetails: string
  cookiesBannerCookiesPolicy: string
  cookiesBannerAccept: string
  webDoNotSellSettingsSavedToast: string
  cookieSettingManageYourCookieTitle: string
  cookieSettingSave: string
  cookieSettingAnalyticsAndMarketing: string
  cookieSettingNecessary: string
  cookieSettingNecessarySubtitle: string
  cookieSettingNecessaryV2: string
  cookieSettingNecessarySubtitleV2: string
  cookieSettingAnalyticsAndMarketingSubtitle: string
  cookieSettingAnalyticsAndMarketingSubtitleV2: string
  cookieManageTip: string
}

export interface DesktopAppSurveyLink {
  default: string
  vn: string
}

export interface Domains {
  kind: string
  captcha: string
  imApi: string
  imFrontier: string
  mTApi: string
  rootApi: string
  secSDK: string
  slardar: string
  starling: string
  tea: string
  libraWebSDK: string
  webcastApi: string
  webcastRootApi: string
  pipoApi: string
  tcc: string
  aweme: string
  locationApi: string
}

export interface DownloadLink {
  microsoft: Microsoft
  apple: Apple
  amazon: Amazon
  google: Google
}

export interface Microsoft {
  visible: boolean
  normal: string
}

export interface Apple {
  visible: boolean
  normal: string
}

export interface Amazon {
  visible: boolean
  normal: string
}

export interface Google {
  visible: boolean
  normal: string
}

export interface GeoCity {
  City: string
  Subdivisions: string
  OriginalSubdivisions: OriginalSubdivision[]
  SubdivisionsArr: string[]
}

export interface OriginalSubdivision {
  GeoNameID: string
  ASCIName: string
  Name: string
  LocalID: string
}

export interface DateFmtLocale {
  name: string
  months: string[]
  monthsShort: string[]
  weekdays: string[]
  weekdaysShort: string[]
  weekdaysMin: string[]
  longDateFormat: LongDateFormat
  meridiem: Meridiem
}

export interface LongDateFormat {
  LT: string
  LTS: string
  L: string
  LL: string
  LLL: string
  LLLL: string
  l: string
  ll: string
  lll: string
  llll: string
  "LL-Y": string
}

export interface Meridiem {
  am: string
  pm: string
  AM: string
  PM: string
}

export interface VideoPlayerConfig {
  fallback: boolean
}

export interface PlaybackNormalizePath {
  path: string[]
}

export interface BitrateConfig {
  bitrateLower: number
  bitrateRange: number[]
  bitrateUpper: number
  mode: string
  paramBf: number
  paramBp: number
  paramLower: number
  paramUpper: number
  paramUpperBl: number
  paramVl1: number
  paramVl2: number
  paramVlLower: number
  paramVlUpper: number
  slidingWindowCountThreshold: number
  slidingWindowExtraction: string
  slidingWindowType: string
  slidingWindowWeight: string
  slidingWindowWeightThreshold: number
}

export interface StudioDownloadEntrance {
  regions: string[]
  userRegions: string[]
  allRegions: boolean
}

export interface LiveSuggestConfig {
  isBlockedArea: boolean
  isRiskArea: boolean
}

export interface LiveAnchorEntrance {
  liveCenter: boolean
  creatorHub: boolean
  liveStudio: boolean
}

export interface XgplayerInitHost {
  group1: string[]
  group2: string[]
}

export interface VideoOrder {
  videoOrder: VideoOrder2[]
}

export interface VideoOrder2 {
  property: string
  detail?: number[]
  order?: string
}

export interface BitrateSelectorConfigs {
  configs: Config2[]
}

export interface Config2 {
  paramBf: number
  paramBp: number
  paramUpper: number
  paramLower: number
  paramUpperBl: number
  paramVl1: number
  paramVl2: number
  paramVlUpper: number
  paramVlLower: number
  bitrateUpper: number
  bitrateLower: number
  slidingWindowType: string
  slidingWindowWeight: string
  slidingWindowWeightThreshold: number
  slidingWindowCountThreshold: number
  slidingWindowExtraction: string
  bitrateRange: number[]
  mode: string
  quality_filter: QualityFilter
  white_list: any[]
  autoBitrateParams: AutoBitrateParams
  defaultBitrate: number
}

export interface QualityFilter {}

export interface AutoBitrateParams {
  paramA: number
  paramB: number
  paramC: number
  paramD: number
  minBitrate: number
}

export interface VideoCoverSettings {
  format: number
  acceptHeader: string
  _ssrCount: number
}

export interface HevcRobustness {
  useHevcRobustTest: boolean
  forceRobustTest: string[]
}

export interface ApiKeys {
  firebase: string
}

export interface Seostate {
  abtest: Abtest
  loading: boolean
  canonical: string
  pageType: number
  launchMode: string
  trafficType: string
}

export interface Abtest {
  canonical: string
  pageId: string
  vidList: any[]
  parameters: Parameters2
}

export interface Parameters2 {
  video_non_tdk_phase2: VideoNonTdkPhase2
  video_page_serp_compliance: VideoPageSerpCompliance
  video_tdk_phase2: VideoTdkPhase2
}

export interface VideoNonTdkPhase2 {
  vid: string
}

export interface VideoPageSerpCompliance {
  vid: string
}

export interface VideoTdkPhase2 {
  vid: string
}

export interface ItemList {
  video: Video
}

export interface Video {
  list: string[]
  browserList: string[]
  loading: boolean
  statusCode: number
  hasMore: boolean
  cursor: string
  preloadList: PreloadList[]
  keyword: string
}

export interface PreloadList {
  url: string
  id: string
}

export interface ItemModule {
  [key as string]: ItemModuleChildren
}

export interface ItemModuleChildren {
  id: string
  desc: string
  createTime: string
  scheduleTime: number
  video: Video2
  author: string
  music: Music
  challenges: Challenge[]
  stats: Stats
  warnInfo: any[]
  originalItem: boolean
  officalItem: boolean
  textExtra: TextExtra[]
  secret: boolean
  forFriend: boolean
  digged: boolean
  itemCommentStatus: number
  takeDown: number
  effectStickers: any[]
  privateItem: boolean
  stickersOnItem: any[]
  shareEnabled: boolean
  comments: any[]
  duetDisplay: number
  stitchDisplay: number
  indexEnabled: boolean
  imagePost: ImagePost
  locationCreated: string
  suggestedWords: string[]
  contents: Content[]
  collected: boolean
  channelTags: any[]
  nickname: string
  authorId: string
  authorSecId: string
  avatarThumb: string
  downloadSetting: number
  authorPrivate: boolean
  capcutAnchorsOriginal: any[]
  capcutAnchors: any[]
}

export interface Video2 {
  id: string
  height: number
  width: number
  duration: number
  ratio: string
  cover: string
  originCover: string
  dynamicCover: string
  playAddr: string
  downloadAddr: string
  shareCover: string[]
  reflowCover: string
  zoomCover: ZoomCover
}

export interface ZoomCover {
  "240": string
  "480": string
  "720": string
  "960": string
}

export interface Music {
  id: string
  title: string
  playUrl: string
  coverLarge: string
  coverMedium: string
  coverThumb: string
  authorName: string
  original: boolean
  duration: number
  album: string
  scheduleSearchTime: number
  collected: boolean
  preciseDuration: PreciseDuration
}

export interface PreciseDuration {
  preciseDuration: number
  preciseShootDuration: number
  preciseAuditionDuration: number
  preciseVideoDuration: number
}

export interface Challenge {
  id: string
  title: string
  desc: string
  profileLarger: string
  profileMedium: string
  profileThumb: string
  coverLarger: string
  coverMedium: string
  coverThumb: string
}

export interface Stats {
  diggCount: number
  shareCount: number
  commentCount: number
  playCount: number
  collectCount: string
}

export interface TextExtra {
  awemeId: string
  start: number
  end: number
  hashtagId?: string
  hashtagName: string
  type: number
  subType: number
  isCommerce: boolean
  userId?: string
  userUniqueId?: string
  secUid?: string
}

export interface ImagePost {
  images: Image[]
  cover: Cover
  shareCover: ShareCover
  title: string
}

export interface Image {
  imageURL: ImageUrl
  imageWidth: number
  imageHeight: number
}

export interface ImageUrl {
  urlList: string[]
}

export interface Cover {
  imageURL: ImageUrl2
  imageWidth: number
  imageHeight: number
}

export interface ImageUrl2 {
  urlList: string[]
}

export interface ShareCover {
  imageURL: ImageUrl3
  imageWidth: number
  imageHeight: number
}

export interface ImageUrl3 {
  urlList: string[]
}

export interface Content {
  desc: string
  textExtra: TextExtra2[]
}

export interface TextExtra2 {
  awemeId: string
  start: number
  end: number
  hashtagId?: string
  hashtagName: string
  type: number
  subType: number
  isCommerce: boolean
  userId?: string
  userUniqueId?: string
  secUid?: string
}

export interface UserModule {
  users: Users
  stats: Stats2
}

export interface Users {
  kralkek: Kralkek
}

export interface Kralkek {
  id: string
  shortId: string
  uniqueId: string
  nickname: string
  avatarLarger: string
  avatarMedium: string
  avatarThumb: string
  signature: string
  createTime: number
  verified: boolean
  secUid: string
  ftc: boolean
  relation: number
  openFavorite: boolean
  commentSetting: number
  duetSetting: number
  stitchSetting: number
  privateAccount: boolean
  secret: boolean
  isADVirtual: boolean
  roomId: string
  uniqueIdModifyTime: number
  ttSeller: boolean
  downloadSetting: number
  recommendReason: string
  nowInvitationCardUrl: string
  nickNameModifyTime: number
  isEmbedBanned: boolean
  canExpPlaylist: boolean
}

export interface Stats2 {}

export interface VideoPage {
  statusCode: number
}

export interface SharingMetaState {
  value: Value
}

export interface Value {
  "al:ios:url": string
  "al:android:url": string
  "al:ios:app_store_id": string
  "al:ios:app_name": string
  "al:android:app_name": string
  "al:android:package": string
  "og:site_name": string
  "og:type": string
  "og:title": string
  "og:description": string
  "fb:app_id": string
  "twitter:app:id:iphone": string
  "twitter:app:id:googleplay": string
  "twitter:card": string
  "twitter:site": string
  "twitter:title": string
  "twitter:description": string
  "og:image": string
  "twitter:image": string
  "og:image:width": string
  "og:image:height": string
}
