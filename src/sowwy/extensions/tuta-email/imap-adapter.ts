/**
 * IMAP Adapter for Tuta Mail
 *
 * Connects to Tuta's IMAP bridge and fetches emails.
 *
 * Requires: npm install imap @types/imap
 */

// Lazy-load IMAP module to handle missing package gracefully
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ImapModule: any = null;
async function getImap() {
  if (!ImapModule) {
    try {
      // @ts-expect-error - imap module may not be installed
      ImapModule = await import("imap");
    } catch {
      throw new Error("IMAP package not installed. Install with: npm install imap @types/imap");
    }
  }
  return ImapModule.default;
}

export interface EmailMessage {
  uid: number;
  sender: string;
  subject: string;
  body: string;
  date: Date;
  threadId?: string;
}

export interface ImapAdapterConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

export class ImapAdapter {
  private imap: any = null;
  private lastUid: number = 0;

  constructor(private config: ImapAdapterConfig) {}

  async connect(): Promise<void> {
    const Imap = await getImap();

    return new Promise((resolve, reject) => {
      this.imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      });

      this.imap.once("ready", () => {
        resolve();
      });

      this.imap.once("error", (err: Error) => {
        reject(err);
      });

      this.imap.connect();
    });
  }

  async fetchNewEmails(): Promise<EmailMessage[]> {
    if (!this.imap) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      if (!this.imap) {
        reject(new Error("IMAP not connected"));
        return;
      }

      this.imap.openBox("INBOX", false, (err: Error | null, box: any) => {
        if (err) {
          reject(err);
          return;
        }

        // Fetch emails with UID greater than lastUid
        const searchCriteria = this.lastUid > 0 ? [`UID`, `${this.lastUid + 1}:*`] : ["ALL"];
        const fetch = this.imap!.search(
          searchCriteria,
          (searchErr: Error | null, uids: number[]) => {
            if (searchErr) {
              reject(searchErr);
              return;
            }

            if (uids.length === 0) {
              resolve([]);
              return;
            }

            const f = this.imap!.fetch(uids, { bodies: "", struct: true });
            const emails: EmailMessage[] = [];

            f.on("message", (msg: any) => {
              let body = "";
              let headers: Record<string, string> = {};

              msg.on("body", (stream: NodeJS.ReadableStream) => {
                let buffer = "";
                stream.on("data", (chunk: Buffer) => {
                  buffer += chunk.toString("utf8");
                });
                stream.on("end", () => {
                  body = buffer;
                });
              });

              msg.once("attributes", (attrs: { uid?: number }) => {
                const uid = attrs.uid;
                if (uid && uid > this.lastUid) {
                  this.lastUid = uid;
                }
              });

              msg.once("end", () => {
                // Parse headers and body from email
                const headerMatch = body.match(/^([\s\S]*?)\r?\n\r?\n([\s\S]*)$/);
                if (headerMatch) {
                  const headerText = headerMatch[1];
                  const bodyText = headerMatch[2];

                  // Parse headers
                  headerText.split(/\r?\n/).forEach((line) => {
                    const match = line.match(/^([^:]+):\s*(.+)$/);
                    if (match) {
                      headers[match[1].toLowerCase()] = match[2];
                    }
                  });

                  emails.push({
                    uid: this.lastUid,
                    sender: headers["from"] || "",
                    subject: headers["subject"] || "",
                    body: bodyText,
                    date: new Date(headers["date"] || Date.now()),
                  });
                }
              });
            });

            f.once("end", () => {
              resolve(emails);
            });

            f.once("error", (fetchErr: Error) => {
              reject(fetchErr);
            });
          },
        );
      });
    });
  }

  async close(): Promise<void> {
    if (this.imap) {
      this.imap.end();
      this.imap = null;
    }
  }
}
