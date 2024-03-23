interface TiktokRehydrationApi {
  itemInfo: ItemInfo;
  shareMeta: ShareMeta;
  statusCode: number;
  statusMsg: string;
}
interface ShareMeta {
  title: string;
  desc: string;
}
interface ItemInfo {
  itemStruct: ItemStruct;
}
interface ItemStruct {
  id: string;
  desc: string;
  createTime: string;
  scheduleTime: number;
  video: Video;
  author: Author;
  music: Music;
  challenges: any[];
  stats: Stats;
  statsV2: StatsV2;
  warnInfo: any[];
  originalItem: boolean;
  officalItem: boolean;
  textExtra: any[];
  secret: boolean;
  forFriend: boolean;
  digged: boolean;
  itemCommentStatus: number;
  takeDown: number;
  effectStickers: any[];
  privateItem: boolean;
  stickersOnItem: any[];
  shareEnabled: boolean;
  comments: any[];
  duetDisplay: number;
  stitchDisplay: number;
  indexEnabled: boolean;
  imagePost: ImagePost;
  locationCreated: string;
  suggestedWords: any[];
  contents: any[];
  collected: boolean;
  channelTags: any[];
  item_control: Itemcontrol;
}
interface Itemcontrol {
}
interface ImagePost {
  images: Image[];
  cover: Image;
  shareCover: Image;
  title: string;
}
interface Image {
  imageURL: ImageURL;
  imageWidth: number;
  imageHeight: number;
}
interface ImageURL {
  urlList: string[];
}
interface StatsV2 {
  diggCount: string;
  shareCount: string;
  commentCount: string;
  playCount: string;
  collectCount: string;
}
interface Stats {
  diggCount: number;
  shareCount: number;
  commentCount: number;
  playCount: number;
  collectCount: string;
}
interface Music {
  id: string;
  title: string;
  playUrl: string;
  coverLarge: string;
  coverMedium: string;
  coverThumb: string;
  authorName: string;
  original: boolean;
  duration: number;
  scheduleSearchTime: number;
  collected: boolean;
  preciseDuration: PreciseDuration;
}
interface PreciseDuration {
  preciseDuration: number;
  preciseShootDuration: number;
  preciseAuditionDuration: number;
  preciseVideoDuration: number;
}
interface Author {
  id: string;
  shortId: string;
  uniqueId: string;
  nickname: string;
  avatarLarger: string;
  avatarMedium: string;
  avatarThumb: string;
  signature: string;
  createTime: number;
  verified: boolean;
  secUid: string;
  ftc: boolean;
  relation: number;
  openFavorite: boolean;
  commentSetting: number;
  duetSetting: number;
  stitchSetting: number;
  privateAccount: boolean;
  secret: boolean;
  isADVirtual: boolean;
  roomId: string;
  uniqueIdModifyTime: number;
  ttSeller: boolean;
  downloadSetting: number;
  recommendReason: string;
  nowInvitationCardUrl: string;
  nickNameModifyTime: number;
  isEmbedBanned: boolean;
  canExpPlaylist: boolean;
  suggestAccountBind: boolean;
}
interface Video {
  id: string;
  height: number;
  width: number;
  duration: number;
  ratio: string;
  cover: string;
  originCover: string;
  dynamicCover: string;
  playAddr: string;
  downloadAddr: string;
  shareCover: string[];
  reflowCover: string;
  zoomCover: ZoomCover;
}
interface ZoomCover {
  '240': string;
  '480': string;
  '720': string;
  '960': string;
}