import assert from 'node:assert/strict';
import test from 'node:test';
import { feedbackTokensByVideo, notInterestedToken } from '../lib/youtubeFeedbackData.ts';

function menuItem(title, token) {
  return { listItemViewModel: {
    title: { content: title },
    rendererContext: { commandContext: { onTap: { innertubeCommand: {
      feedbackEndpoint: { feedbackToken: token },
    } } } },
  } };
}

test('selects only the Not interested command from a recommendation', () => {
  const card = { lockupViewModel: {
    contentId: 'video-1',
    metadata: { lockupMetadataViewModel: { menuButton: { buttonViewModel: {
      onTap: { innertubeCommand: { showSheetCommand: {
        panelLoadingStrategy: { inlineContent: { sheetViewModel: { content: { listViewModel: {
          listItems: [menuItem('Not interested', 'correct-token'), menuItem("Don't recommend channel", 'wrong-token')],
        } } } } },
      } } },
    } } } },
  } };

  assert.equal(notInterestedToken(card), 'correct-token');
  assert.equal(feedbackTokensByVideo({ contents: [card] }).get('video-1'), 'correct-token');
});

test('skips cards without a Not interested command', () => {
  const model = { videoRenderer: { videoId: 'video-2', menu: { items: [
    { menuServiceItemRenderer: { text: { runs: [{ text: 'Save to playlist' }] }, serviceEndpoint: { feedbackEndpoint: { feedbackToken: 'other' } } } },
  ] } } };
  assert.equal(feedbackTokensByVideo(model).size, 0);
});
