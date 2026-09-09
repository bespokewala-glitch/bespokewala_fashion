import crypto from "crypto";

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PIXEL_ID = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Helper to hash PII data (Meta requires SHA-256 lowercase hex)
export const hashData = (data: string) => {
  if (!data) return undefined;
  return crypto.createHash("sha256").update(data.toLowerCase().trim()).digest("hex");
};

interface MetaEventData {
  eventName: string;
  eventTime?: number;
  eventId: string;
  sourceUrl: string;
  clientIp?: string;
  clientUserAgent?: string;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    externalId?: string;
  };
  customData?: {
    value?: number;
    currency?: string;
    content_ids?: string[];
    content_type?: string;
    content_name?: string;
    num_items?: number;
    search_string?: string;
  };
}

export const sendMetaEvent = async (eventData: MetaEventData) => {
  if (!META_ACCESS_TOKEN || !META_PIXEL_ID) {
    console.warn("[Meta CAPI] Missing META_ACCESS_TOKEN or META_PIXEL_ID");
    return;
  }

  try {
    const {
      eventName,
      eventTime = Math.floor(Date.now() / 1000),
      eventId,
      sourceUrl,
      clientIp,
      clientUserAgent,
      userData = {},
      customData = {},
    } = eventData;

    const formattedUserData: any = {
      client_user_agent: clientUserAgent,
    };

    if (clientIp) formattedUserData.client_ip_address = clientIp;
    if (userData.email) formattedUserData.em = [hashData(userData.email)];
    if (userData.phone) formattedUserData.ph = [hashData(userData.phone)];
    if (userData.firstName) formattedUserData.fn = [hashData(userData.firstName)];
    if (userData.lastName) formattedUserData.ln = [hashData(userData.lastName)];
    if (userData.city) formattedUserData.ct = [hashData(userData.city)];
    if (userData.state) formattedUserData.st = [hashData(userData.state)];
    if (userData.zipCode) formattedUserData.zp = [hashData(userData.zipCode)];
    if (userData.country) formattedUserData.country = [hashData(userData.country)];
    if (userData.externalId) formattedUserData.external_id = [hashData(userData.externalId)];

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: eventTime,
          action_source: "website",
          event_source_url: sourceUrl,
          event_id: eventId,
          user_data: formattedUserData,
          custom_data: customData,
        },
      ],
    };

    const url = `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("[Meta CAPI] Failed to send event:", responseData);
    } else {
      console.log(`[Meta CAPI] Event ${eventName} sent successfully`);
    }
  } catch (error) {
    console.error("[Meta CAPI] Error sending event:", error);
  }
};
