/**
 * RapidShyp — hands a paid order to the courier as a shipment.
 *
 * Best-effort by design: it is called after a payment has already succeeded, so
 * a failure here must never undo the sale. It needs two env vars — the API key
 * and the name of a pickup location you created in the RapidShyp portal.
 *
 * Docs: https://docs.rapidshyp.com/docs/DocumentationSidebar/Forward%20B2C/Orders/POST%20Create%20Order%20API
 */

const CREATE_ORDER_URL = "https://api.rapidshyp.com/rapidshyp/apis/v1/create_order";
const APPROVE_ORDER_URL = "https://api.rapidshyp.com/rapidshyp/apis/v1/approve_orders";
const STORE_NAME = "DEFAULT";

/**
 * Approves an order so it leaves "Approval Pending" and becomes a real,
 * ready-to-ship shipment (RapidShyp only assigns a shipment/AWB after approval).
 * Best-effort: returns true only when RapidShyp confirms the approval.
 */
async function approveRapidshypOrder(token: string, reference: string): Promise<boolean> {
  try {
    const res = await fetch(APPROVE_ORDER_URL, {
      method: "POST",
      headers: { "rapidshyp-token": token, "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: [reference], store_name: STORE_NAME }),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as {
      status?: string;
      success_count?: number;
    };
    // Approve replies with a lowercase status ("success") — unlike create's "SUCCESS".
    return res.ok && ((json.status ?? "").toLowerCase() === "success" || (json.success_count ?? 0) > 0);
  } catch {
    return false;
  }
}

export function isRapidshypConfigured() {
  return Boolean(process.env.RAPIDSHYP_API_KEY && process.env.RAPIDSHYP_PICKUP_NAME);
}

export type ShipmentOrder = {
  reference: string;
  buyerName: string;
  phone: string;
  email: string | null;
  pincode: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  shipping: number;
  items: { slug: string; name: string; qty: number; unitPrice: number }[];
  /** Total chargeable pack weight of the order, in grams. */
  grams: number;
};

export type ShipmentResult = { ok: true; id: string } | { ok: false; message: string };

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function createRapidshypShipment(order: ShipmentOrder): Promise<ShipmentResult> {
  const token = process.env.RAPIDSHYP_API_KEY;
  const pickup = process.env.RAPIDSHYP_PICKUP_NAME;
  if (!token || !pickup) return { ok: false, message: "RapidShyp is not configured." };

  const [firstName, ...rest] = (order.buyerName || "Customer").trim().split(/\s+/);
  const lastName = rest.join(" ");

  const grams = Math.max(1, Math.round(order.grams));
  // A cube whose volumetric weight (L×B×H / 5000) equals our pack weight, so the
  // courier bills on the weight we already charged the buyer for.
  const side = Math.max(10, Math.round(Math.cbrt(grams * 5)));

  const body = {
    orderId: order.reference,
    orderDate: todayIso(),
    pickupAddressName: pickup,
    storeName: STORE_NAME,
    billingIsShipping: true,
    paymentMethod: "PREPAID",
    shippingAddress: {
      firstName: (firstName || "Customer").slice(0, 60),
      lastName: lastName.slice(0, 60) || undefined,
      addressLine1: [order.addressLine1, order.city].filter(Boolean).join(", ").slice(0, 100),
      addressLine2: (order.addressLine2 || order.state || "").slice(0, 100) || undefined,
      pinCode: order.pincode,
      email: order.email || undefined,
      phone: order.phone,
    },
    orderItems: order.items.map((i) => ({
      itemName: i.name.slice(0, 200),
      sku: i.slug,
      units: Math.max(1, Math.floor(i.qty)),
      unitPrice: Math.max(1, i.unitPrice),
      tax: 0,
    })),
    shippingCharges: Math.max(0, order.shipping || 0),
    packageDetails: {
      packageLength: side,
      packageBreadth: side,
      packageHeight: side,
      packageWeight: grams,
    },
  };

  try {
    const res = await fetch(CREATE_ORDER_URL, {
      method: "POST",
      headers: { "rapidshyp-token": token, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as {
      status?: string;
      remarks?: string;
      message?: string;
      order_id?: string;
    };
    const createOk = res.ok && json.status === "SUCCESS";
    const id = String(json.order_id ?? order.reference);

    // Auto-approve so the order doesn't sit in "Approval Pending" (where it has no
    // shipment/AWB and stays hidden from the main portal list). This also recovers a
    // re-submission: if create reported a duplicate, approving the already-created
    // order still moves it to ready-to-ship.
    const approved = await approveRapidshypOrder(token, id);

    if (createOk || approved) return { ok: true, id };
    return { ok: false, message: json.remarks || json.message || `RapidShyp error ${res.status}` };
  } catch {
    return { ok: false, message: "Could not reach RapidShyp." };
  }
}
