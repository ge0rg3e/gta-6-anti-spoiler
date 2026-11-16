type RecordLike = Record<string, unknown>;

function object(value: unknown): RecordLike | undefined {
  return value && typeof value === 'object' ? value as RecordLike : undefined;
}

function tokenWithin(value: unknown): string | undefined {
  const seen = new WeakSet<object>();
  function visit(node: unknown): string | undefined {
    const data = object(node);
    if (!data || seen.has(data)) return;
    seen.add(data);
    const endpoint = object(data.feedbackEndpoint);
    if (typeof endpoint?.feedbackToken === 'string') return endpoint.feedbackToken;
    for (const child of Object.values(data)) {
      const token = visit(child);
      if (token) return token;
    }
  }
  return visit(value);
}

export function notInterestedToken(model: unknown): string | undefined {
  const seen = new WeakSet<object>();
  function visit(node: unknown): string | undefined {
    const data = object(node);
    if (!data || seen.has(data)) return;
    seen.add(data);
    const item = object(data.listItemViewModel) ?? object(data.menuServiceItemRenderer);
    if (item) {
      const title = object(item.title)?.content;
      const runs = object(item.text)?.runs;
      const text = typeof title === 'string' ? title :
        Array.isArray(runs) ? runs.map(run => object(run)?.text ?? '').join('') : '';
      if (text === 'Not interested') return tokenWithin(item);
    }
    for (const child of Object.values(data)) {
      const token = visit(child);
      if (token) return token;
    }
  }
  return visit(model);
}

export function feedbackTokensByVideo(root: unknown): Map<string, string> {
  const tokens = new Map<string, string>();
  const seen = new WeakSet<object>();
  function visit(node: unknown): void {
    const data = object(node);
    if (!data || seen.has(data)) return;
    seen.add(data);
    for (const key of ['lockupViewModel', 'videoRenderer', 'compactVideoRenderer', 'reelItemRenderer']) {
      const model = object(data[key]);
      const id = model?.contentId ?? model?.videoId;
      if (typeof id === 'string' && !tokens.has(id)) {
        const token = notInterestedToken(model);
        if (token) tokens.set(id, token);
      }
    }
    for (const child of Object.values(data)) visit(child);
  }
  visit(root);
  return tokens;
}
