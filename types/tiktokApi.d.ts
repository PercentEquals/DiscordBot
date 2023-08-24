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
    appContext: InnerAppContext
    initialized: boolean
    lang: string
    sideNavActive: boolean
  }
  
  export interface InnerAppContext {
    language: string
    region: string
    appId: number
    appType: string
    user: User
    wid: string
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
  
  export interface User {
    ftcUser: boolean
    secUid: string
    uid: string
    nickName: string
    signature: string
    uniqueId: string
    createTime: string
    hasLivePermission: boolean
    roomId: string
    region: string
    avatarUri: string[]
    isPrivateAccount: boolean
    hasIMPermission: boolean
    hasSearchPermission: boolean
    storeRegion: string
    showPrivateBanner: boolean
    showScheduleTips: boolean
    longVideoMinutes: number
    ageGateRegion: string
    ageGateTime: string
    userMode: number
    hasSearchLivePermission: boolean
    proAccountInfo: ProAccountInfo
    analyticsOn: boolean
    redDot: any[]
    photoSensitiveVideosSetting: number
    hasCollectionsAccess: boolean
    hasCollectionsRedDot: boolean
    canExpPlaylist: boolean
    showPodcastTooltip: boolean
  }
  
  export interface ProAccountInfo {
    status: number
    analyticsOn: boolean
    businessSuiteEntrance: boolean
    downloadLink: DownloadLink
  }
  
  export interface DownloadLink {}
  
  export interface AbTestVersion {
    versionName: string
    parameters: Parameters
  }
  
  export interface Parameters {
    use_follow_v2: UseFollowV2
    studio_web_eh_entrance: StudioWebEhEntrance
    xgplayer_preload_config: XgplayerPreloadConfig
    periodic_login_popup_interval: PeriodicLoginPopupInterval
    profile_ui_opt: ProfileUiOpt
    enable_ml_model: EnableMlModel
    video_feed_redesign: VideoFeedRedesign
    xg_volume_test: XgVolumeTest
    has_system_notification_inbox_mobile: HasSystemNotificationInboxMobile
    video_bitrate_adapt: VideoBitrateAdapt
    browser_mode_creator_tab_3: BrowserModeCreatorTab3
    confirm_logout: ConfirmLogout
    webapp_switch_account: WebappSwitchAccount
    creator_center_connect: CreatorCenterConnect
    one_column_player_size: OneColumnPlayerSize
    volume_normalize: VolumeNormalize
    enable_not_interested: EnableNotInterested
    search_video: SearchVideo
    share_button_part1_test: ShareButtonPart1Test
    mobile_search_test: MobileSearchTest
    webapp_login_email_phone: WebappLoginEmailPhone
    video_serverpush: VideoServerpush
    qr_sso_popup: QrSsoPopup
    browser_login_redirect: BrowserLoginRedirect
    should_highlight_hashtag: ShouldHighlightHashtag
    mobile_vodkit: MobileVodkit
    sign_up_webapp_region_change: SignUpWebappRegionChange
    use_inbox_notice_count_api: UseInboxNoticeCountApi
    has_system_notification_inbox: HasSystemNotificationInbox
    login_modal_ui_revamp: LoginModalUiRevamp
    add_guide_login_test: AddGuideLoginTest
    add_kap_entry: AddKapEntry
    browse_mode_autoplay_test: BrowseModeAutoplayTest
    close_to_zoom_out_test: CloseToZoomOutTest
    comment_refactor_test: CommentRefactorTest
    creator_center_connect_global: CreatorCenterConnectGlobal
    creator_center_test: CreatorCenterTest
    desktop_ui_opt: DesktopUiOpt
    desktop_ui_reply: DesktopUiReply
    enhance_video_consumption_test: EnhanceVideoConsumptionTest
    explore_test: ExploreTest
    favorite_test: FavoriteTest
    following_red_dot: FollowingRedDot
    increase_detail_page_cover_quantity_test: IncreaseDetailPageCoverQuantityTest
    kep_new_ui_login: KepNewUiLogin
    kep_video_sort_exp: KepVideoSortExp
    live_abr_version: LiveAbrVersion
    live_anchor_banner_style_test: LiveAnchorBannerStyleTest
    live_dark_mode: LiveDarkMode
    live_end_improved_metrics: LiveEndImprovedMetrics
    live_golive_entrance: LiveGoliveEntrance
    live_historical_comments: LiveHistoricalComments
    live_lcp_perf_optimize: LiveLcpPerfOptimize
    live_player_icon: LivePlayerIcon
    live_player_mute_text: LivePlayerMuteText
    live_player_switch_button: LivePlayerSwitchButton
    live_recharge_by_amount: LiveRechargeByAmount
    live_recharge_exchange: LiveRechargeExchange
    live_room_age_restriction: LiveRoomAgeRestriction
    live_studio_download_refactor_pc: LiveStudioDownloadRefactorPc
    live_top_viewers: LiveTopViewers
    migrate_report_to_tsop: MigrateReportToTsop
    non_personalized_feeds_web: NonPersonalizedFeedsWeb
    optimise_browser_mode: OptimiseBrowserMode
    pc_video_playlist_test: PcVideoPlaylistTest
    photo_test: PhotoTest
    reasons_api_version: ReasonsApiVersion
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
    tiktok_web: TiktokWeb
    ttlive_broadcast_topic_version_two: TtliveBroadcastTopicVersionTwo
    ui_layout_alignment: UiLayoutAlignment
    video_detail_search_bar: VideoDetailSearchBar
    webapp_exp: WebappExp
    webapp_explore_category: WebappExploreCategory
    webapp_recommend_language: WebappRecommendLanguage
    webapp_video_detail_page_related_mask: WebappVideoDetailPageRelatedMask
  }
  
  export interface UseFollowV2 {
    vid: string
  }
  
  export interface StudioWebEhEntrance {
    vid: string
  }
  
  export interface XgplayerPreloadConfig {
    vid: string
  }
  
  export interface PeriodicLoginPopupInterval {
    vid: string
  }
  
  export interface ProfileUiOpt {
    vid: string
  }
  
  export interface EnableMlModel {
    vid: string
  }
  
  export interface VideoFeedRedesign {
    vid: string
  }
  
  export interface XgVolumeTest {
    vid: string
  }
  
  export interface HasSystemNotificationInboxMobile {
    vid: string
  }
  
  export interface VideoBitrateAdapt {
    vid: string
  }
  
  export interface BrowserModeCreatorTab3 {
    vid: string
  }
  
  export interface ConfirmLogout {
    vid: string
  }
  
  export interface WebappSwitchAccount {
    vid: string
  }
  
  export interface CreatorCenterConnect {
    vid: string
  }
  
  export interface OneColumnPlayerSize {
    vid: string
  }
  
  export interface VolumeNormalize {
    vid: string
  }
  
  export interface EnableNotInterested {
    vid: string
  }
  
  export interface SearchVideo {
    vid: string
  }
  
  export interface ShareButtonPart1Test {
    vid: string
  }
  
  export interface MobileSearchTest {
    vid: string
  }
  
  export interface WebappLoginEmailPhone {
    vid: string
  }
  
  export interface VideoServerpush {
    vid: string
  }
  
  export interface QrSsoPopup {
    vid: string
  }
  
  export interface BrowserLoginRedirect {
    vid: string
  }
  
  export interface ShouldHighlightHashtag {
    vid: string
  }
  
  export interface MobileVodkit {
    vid: string
  }
  
  export interface SignUpWebappRegionChange {
    vid: string
  }
  
  export interface UseInboxNoticeCountApi {
    vid: string
  }
  
  export interface HasSystemNotificationInbox {
    vid: string
  }
  
  export interface LoginModalUiRevamp {
    vid: string
  }
  
  export interface AddGuideLoginTest {
    vid: string
  }
  
  export interface AddKapEntry {
    vid: string
  }
  
  export interface BrowseModeAutoplayTest {
    vid: string
  }
  
  export interface CloseToZoomOutTest {
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
  
  export interface EnhanceVideoConsumptionTest {
    vid: string
  }
  
  export interface ExploreTest {
    vid: string
  }
  
  export interface FavoriteTest {
    vid: string
  }
  
  export interface FollowingRedDot {
    vid: string
  }
  
  export interface IncreaseDetailPageCoverQuantityTest {
    vid: string
  }
  
  export interface KepNewUiLogin {
    vid: string
  }
  
  export interface KepVideoSortExp {
    vid: string
  }
  
  export interface LiveAbrVersion {
    vid: string
  }
  
  export interface LiveAnchorBannerStyleTest {
    vid: string
  }
  
  export interface LiveDarkMode {
    vid: string
  }
  
  export interface LiveEndImprovedMetrics {
    vid: string
  }
  
  export interface LiveGoliveEntrance {
    vid: string
  }
  
  export interface LiveHistoricalComments {
    vid: string
  }
  
  export interface LiveLcpPerfOptimize {
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
  
  export interface LiveRechargeByAmount {
    vid: string
  }
  
  export interface LiveRechargeExchange {
    vid: string
  }
  
  export interface LiveRoomAgeRestriction {
    vid: string
  }
  
  export interface LiveStudioDownloadRefactorPc {
    vid: string
  }
  
  export interface LiveTopViewers {
    vid: string
  }
  
  export interface MigrateReportToTsop {
    vid: string
  }
  
  export interface NonPersonalizedFeedsWeb {
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
  
  export interface ReasonsApiVersion {
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
  
  export interface TiktokWeb {
    fbv_notice_enable: number
  }
  
  export interface TtliveBroadcastTopicVersionTwo {
    vid: string
  }
  
  export interface UiLayoutAlignment {
    vid: string
  }
  
  export interface VideoDetailSearchBar {
    vid: string
  }
  
  export interface WebappExp {
    vid: string
  }
  
  export interface WebappExploreCategory {
    vid: string
  }
  
  export interface WebappRecommendLanguage {
    vid: string
  }
  
  export interface WebappVideoDetailPageRelatedMask {
    vid: string
  }
  
  export interface BizContext {
    bizContext: InnerBizContext
    initialized: boolean
  }
  
  export interface InnerBizContext {
    os: string
    isMobile: boolean
    isAndroid: boolean
    isIOS: boolean
    jumpType: string
    navList: NavList[]
    kapLinks: KapLink[]
    config: Config
    domains: Domains
    downloadLink: DownloadLink2
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
  }
  
  export interface NavList {
    title: string
    children: NavListChildren[]
  }
  
  export interface NavListChildren {
    title: string
    href: string
    key?: string
  }
  
  export interface KapLink {
    title: string
    children: KapLinkChildren[]
  }
  
  export interface KapLinkChildren {
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
  }
  
  export interface FeatureFlags {
    feature_bar: boolean
    business_account_open: boolean
    feature_tt4b_ads: boolean
    support_multiline_desc: boolean
    pc_video_playlist: boolean
    feature_mobile_ui_opt_stage2: boolean
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
  
  export interface DownloadLink2 {
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
  
  export interface Seostate {
    metaParams: MetaParams
    jsonldList: [string, JsonldList][]
    abtest: Abtest
    loading: boolean
    canonical: string
    pageType: number
    launchMode: string
    trafficType: string
    keywordMergeStatus: KeywordMergeStatus
    useNewUI: boolean
  }
  
  export interface MetaParams {
    title: string
    keywords: string
    description: string
    canonicalHref: string
    robotsContent: string
    applicableDevice: string
  }
  
  export interface JsonldList {
    itemListElement?: ItemListElement[]
  }
  
  export interface ItemListElement {
    "@type": string
    position: number
    item: Item
  }
  
  export interface Item {
    "@type": string
    "@id": string
    name: string
  }
  
  export interface Abtest {
    pageId: string
    vidList: any[]
    parameters: AbtestParameters
  }
  
  export interface AbtestParameters {
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
  
  export interface KeywordMergeStatus {}
  
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
    [key]: ItemModuleChildren
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
    duetEnabled: boolean
    stitchEnabled: boolean
    stickersOnItem: any[]
    shareEnabled: boolean
    comments: any[]
    duetDisplay: number
    stitchDisplay: number
    indexEnabled: boolean
    locationCreated: string
    suggestedWords: any[]
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
    imagePost: {
      images: Image[]
    }
  }
  
  export interface Image {
    imageURL: { urlList: string[] }
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
    bitrate: number
    encodedType: string
    format: string
    videoQuality: string
    encodeUserTag: string
    codecType: string
    definition: string
    subtitleInfos: any[]
    zoomCover: ZoomCover
    volumeInfo: VolumeInfo
    bitrateInfo: BitrateInfo[]
  }
  
  export interface ZoomCover {
    "240": string
    "480": string
    "720": string
    "960": string
  }
  
  export interface VolumeInfo {
    Loudness: number
    Peak: number
  }
  
  export interface BitrateInfo {
    GearName: string
    Bitrate: number
    QualityType: number
    PlayAddr: PlayAddr
    CodecType: string
  }
  
  export interface PlayAddr {
    Uri: string
    UrlList: string[]
    DataSize: string
    UrlKey: string
    FileHash: string
    FileCs: string
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
    hashtagId: string
    hashtagName: string
    type: number
    subType: number
    isCommerce: boolean
  }
  
  export interface Content {
    desc: string
    textExtra: ContentTextArea[]
  }
  
  export interface ContentTextArea {
    awemeId: string
    start: number
    end: number
    hashtagId: string
    hashtagName: string
    type: number
    subType: number
    isCommerce: boolean
  }
  
  export interface UserModule {
    users: Users
  }
  
  export interface Users {
    dasherzone: Dasherzone
  }
  
  export interface Dasherzone {
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
  