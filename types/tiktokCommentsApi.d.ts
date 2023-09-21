export interface TiktokCommentsApi {
    alias_comment_deleted: boolean
    comments: Comment[]
    cursor: number
    extra: Extra
    has_more: number
    log_pb: LogPb
    reply_style: number
    status_code: number
    top_gifts: any
    total: number
  }
  
  export interface Comment {
    author_pin: boolean
    aweme_id: string
    cid: string
    collect_stat: number
    comment_language: string
    create_time: number
    digg_count: number
    image_list: any
    is_author_digged: boolean
    label_list: any
    no_show: boolean
    reply_comment?: ReplyComment[]
    reply_comment_total: number
    reply_id: string
    reply_to_reply_id: string
    share_info: ShareInfo2
    status: number
    stick_position: number
    text: string
    text_extra: TextExtra[]
    trans_btn_style: number
    user: User2
    user_buried: boolean
    user_digged: number
  }
  
  export interface ReplyComment {
    aweme_id: string
    cid: string
    collect_stat: number
    comment_language: string
    create_time: number
    digg_count: number
    image_list: any
    is_author_digged: boolean
    label_list: LabelList[]
    label_text: string
    label_type: number
    no_show: boolean
    reply_comment: any
    reply_id: string
    reply_to_reply_id: string
    share_info: ShareInfo
    status: number
    text: string
    text_extra: any[]
    trans_btn_style: number
    user: User
    user_buried: boolean
    user_digged: number
  }
  
  export interface LabelList {
    text: string
    type: number
  }
  
  export interface ShareInfo {
    acl: Acl
    desc: string
    title: string
    url: string
  }
  
  export interface Acl {
    code: number
    extra: string
  }
  
  export interface User {
    account_labels: any
    ad_cover_url: any
    advance_feature_item_order: any
    advanced_feature_info: any
    avatar_thumb: AvatarThumb
    bold_fields: any
    can_message_follow_status_list: any
    can_set_geofencing: any
    cha_list: any
    cover_url: any
    custom_verify: string
    enterprise_verify_reason: string
    events: any
    followers_detail: any
    geofencing: any
    homepage_bottom_toast: any
    item_list: any
    mutual_relation_avatars: any
    need_points: any
    nickname: string
    platform_sync_info: any
    relative_users: any
    search_highlight: any
    sec_uid: string
    shield_edit_field_info: any
    type_label: any
    uid: string
    unique_id: string
    user_profile_guide: any
    user_tags: any
    white_cover_url: any
  }
  
  export interface AvatarThumb {
    uri: string
    url_list: string[]
    url_prefix: any
  }
  
  export interface ShareInfo2 {
    acl: Acl2
    desc: string
    title: string
    url: string
  }
  
  export interface Acl2 {
    code: number
    extra: string
  }
  
  export interface TextExtra {
    end: number
    hashtag_id: string
    hashtag_name: string
    sec_uid: string
    start: number
    user_id: string
  }
  
  export interface User2 {
    account_labels: any
    ad_cover_url: any
    advance_feature_item_order: any
    advanced_feature_info: any
    avatar_thumb: AvatarThumb2
    bold_fields: any
    can_message_follow_status_list: any
    can_set_geofencing: any
    cha_list: any
    cover_url: any
    custom_verify: string
    enterprise_verify_reason: string
    events: any
    followers_detail: any
    geofencing: any
    homepage_bottom_toast: any
    item_list: any
    mutual_relation_avatars: any
    need_points: any
    nickname: string
    platform_sync_info: any
    relative_users: any
    search_highlight: any
    sec_uid: string
    shield_edit_field_info: any
    type_label: any
    uid: string
    unique_id: string
    user_profile_guide: any
    user_tags: any
    white_cover_url: any
  }
  
  export interface AvatarThumb2 {
    uri: string
    url_list: string[]
    url_prefix: any
  }
  
  export interface Extra {
    fatal_item_ids: any
    now: number
  }
  
  export interface LogPb {
    impr_id: string
  }
  