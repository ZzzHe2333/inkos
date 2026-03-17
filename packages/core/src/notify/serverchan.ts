export interface ServerChanConfig {
  readonly sendUrl: string;
}

export async function sendServerChan(
  config: ServerChanConfig,
  title: string,
  content: string,
): Promise<void> {
  const url = new URL(config.sendUrl);
  url.searchParams.set("title", title);
  url.searchParams.set("desp", content);

  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ServerChan send failed: ${response.status} ${body}`);
  }
}
