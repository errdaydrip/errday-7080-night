// 유튜브 재생목록 HTML 파서: 새 lockupViewModel + 예전 playlistVideoRenderer, 페이지의 잡다한 videoId는 무시
const a=require('assert'),{parsePlaylistHtml}=require('../yt-playlist');
const neu=`<!doctype html><script>var ytInitialData = {"contents":{"twoColumnBrowseResultsRenderer":{"tabs":[{"tabRenderer":{"content":{"sectionListRenderer":{"contents":[
  {"lockupViewModel":{"contentId":"_1CveOV9mLk","contentType":"LOCKUP_CONTENT_TYPE_VIDEO","metadata":{"lockupMetadataViewModel":{"title":{"content":"곡 A"}}},"contentImage":{"thumbnailViewModel":{"overlays":[{"thumbnailBottomOverlayViewModel":{"badges":[{"thumbnailBadgeViewModel":{"text":"3:23"}}]}}]}}}},
  {"lockupViewModel":{"contentId":"1MTS-VzAKvU","contentType":"LOCKUP_CONTENT_TYPE_VIDEO","metadata":{"lockupMetadataViewModel":{"title":{"content":"곡 B"}}}}}
]}}}}]}},"sidebar":{"videoId":"dQw4w9WgXcQ"}}};</script>`;
let out=parsePlaylistHtml(neu);a.strictEqual(out.length,2);a.strictEqual(out[0].id,'_1CveOV9mLk');a.strictEqual(out[0].title,'곡 A');a.strictEqual(out[0].dur,203);a.strictEqual(out[1].id,'1MTS-VzAKvU');a.ok(!out.some(x=>x.id==='dQw4w9WgXcQ'),'ignores sidebar ids');
const old=`{"playlistVideoRenderer":{"videoId":"abcdefghijk","title":{"runs":[{"text":"옛 곡"}]},"lengthSeconds":"90"}}`;
out=parsePlaylistHtml('<script>var ytInitialData = '+old+';</script>');a.strictEqual(out[0].id,'abcdefghijk');a.strictEqual(out[0].title,'옛 곡');a.strictEqual(out[0].dur,90);
const stray='hello "videoId":"xxxxxxxxxxx" and "videoId":"yyyyyyyyyyy"';a.deepStrictEqual(parsePlaylistHtml(stray),[]);
console.log('yt-playlist OK');
