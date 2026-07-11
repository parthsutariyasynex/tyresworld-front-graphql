"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────

export type FormField = {
  code: string;
  label: string;
  frontend_input: string;
  frontend_class: string | null;
  default_value: string | null;
  is_required: boolean;
  options: { label: string; value: string }[];
};

type AddressData = {
  id?: number;
  firstname?: string;
  lastname?: string;
  telephone?: string;
  street?: string[];
  city?: string;
  postcode?: string;
  country_code?: string;
  region?: { region?: string | null; region_id?: number | null; region_code?: string | null } | null;
  default_shipping?: boolean;
  default_billing?: boolean;
  [key: string]: unknown;
};

type CustomerData = {
  firstname?: string;
  lastname?: string;
};

export type Props = {
  mode: "create" | "edit";
  editingAddress?: AddressData | null;
  customer?: CustomerData | null;
  onSuccess: () => void;
  onBack: () => void;
};

// ── Constants ─────────────────────────────────────────────────────

const CONTACT_CODES = new Set(["firstname", "lastname", "company", "telephone"]);

const FORM_CODE: Record<"create" | "edit", string> = {
  create: "customer_register_address",
  edit:   "customer_address_edit",
};

// ── Helpers ───────────────────────────────────────────────────────

function getInitialValues(
  fields: FormField[],
  mode: "create" | "edit",
  editingAddress: AddressData | null | undefined,
  customer: CustomerData | null | undefined,
): Record<string, string> {
  const vals: Record<string, string> = {};
  for (const f of fields) {
    let v = f.default_value ?? "";
    if (mode === "edit" && editingAddress) {
      switch (f.code) {
        case "firstname":   v = editingAddress.firstname ?? ""; break;
        case "lastname":    v = editingAddress.lastname  ?? ""; break;
        case "company":     v = (editingAddress.company as string | undefined) ?? ""; break;
        case "telephone":   v = editingAddress.telephone ?? ""; break;
        case "street":      v = (editingAddress.street ?? []).join("\n"); break;
        case "city":        v = editingAddress.city      ?? ""; break;
        case "postcode":    v = editingAddress.postcode  ?? ""; break;
        case "country_id":  v = editingAddress.country_code ?? ""; break;
        case "region":      v = editingAddress.region?.region      ?? ""; break;
        case "region_id":   v = String(editingAddress.region?.region_id ?? ""); break;
        case "region_code": v = editingAddress.region?.region_code ?? ""; break;
        case "vat_id":      v = (editingAddress.vat_id as string | undefined) ?? ""; break;
        default:            v = f.default_value ?? ""; break;
      }
    } else if (mode === "create") {
      switch (f.code) {
        case "firstname":  v = customer?.firstname ?? ""; break;
        case "lastname":   v = customer?.lastname  ?? ""; break;
        case "country_id": v = f.default_value ?? "SA"; break;
        default:           v = f.default_value ?? ""; break;
      }
    }
    vals[f.code] = v;
  }
  return vals;
}

function buildInput(
  values: Record<string, string>,
  mode: "create" | "edit",
  editingAddress: AddressData | null | undefined,
): Record<string, unknown> {
  const input: Record<string, unknown> = {};

  for (const [code, val] of Object.entries(values)) {
    switch (code) {
      case "street": {
        const lines = val.split("\n").map(s => s.trim()).filter(Boolean);
        input.street = lines.length ? lines : [val];
        break;
      }
      case "country_id":
        if (val) input.country_code = val;
        break;
      case "region": {
        const r = (input.region as Record<string, unknown>) ?? {};
        if (val) r.region = val;
        input.region = r;
        break;
      }
      case "region_id": {
        const id = parseInt(val, 10);
        if (!isNaN(id) && id > 0) {
          const r = (input.region as Record<string, unknown>) ?? {};
          r.region_id = id;
          input.region = r;
        }
        break;
      }
      case "region_code": {
        const r = (input.region as Record<string, unknown>) ?? {};
        if (val) r.region_code = val;
        input.region = r;
        break;
      }
      default:
        if (val !== "") input[code] = val;
    }
  }

  input.default_shipping = mode === "edit" ? (editingAddress?.default_shipping ?? false) : false;
  input.default_billing  = mode === "edit" ? (editingAddress?.default_billing  ?? false) : false;

  return input;
}

// ── Field renderer ────────────────────────────────────────────────

const INPUT_CLS =
  "w-full bg-white border border-gray-300 rounded px-4 py-2.5 text-sm text-gray-900 " +
  "focus:outline-none focus:ring-1 focus:ring-black focus:border-black";

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (val: string) => void;
}) {
  const type = field.frontend_input.toUpperCase();

  const label = (
    <label className="text-[11px] font-bold text-gray-700 uppercase mb-1.5 block">
      {field.label}
      {field.is_required && " *"}
    </label>
  );

  if (type === "MULTILINE") {
    return (
      <div className="sm:col-span-2">
        {label}
        <textarea
          required={field.is_required}
          rows={3}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={INPUT_CLS + " resize-none"}
        />
      </div>
    );
  }

  if (type === "SELECT") {
    return (
      <div>
        {label}
        <select
          required={field.is_required}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={INPUT_CLS}
        >
          <option value="">— Select —</option>
          {field.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }

  if (type === "BOOLEAN") {
    return (
      <div className="flex items-center gap-2.5 pt-5">
        <input
          type="checkbox"
          id={`addr-field-${field.code}`}
          checked={value === "1" || value === "true"}
          onChange={e => onChange(e.target.checked ? "1" : "0")}
          className="w-4 h-4 accent-[#ed1c24] cursor-pointer"
        />
        <label htmlFor={`addr-field-${field.code}`} className="text-sm text-gray-800 cursor-pointer">
          {field.label}
        </label>
      </div>
    );
  }

  // TEXT (default)
  return (
    <div>
      {label}
      <input
        type="text"
        required={field.is_required}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={INPUT_CLS}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function DynamicAddressForm({
  mode,
  editingAddress,
  customer,
  onSuccess,
  onBack,
}: Props) {
  const [fields,     setFields]     = useState<FormField[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [values,     setValues]     = useState<Record<string, string>>({});
  const [saving,     setSaving]     = useState(false);
  const [submitError, setSubmitError] = useState("");

  const formCode = FORM_CODE[mode];

  // Fetch form field definitions from Magento
  useEffect(() => {
    let active = true;
    setLoading(true);
    setFetchError("");

    fetch(`/api/address-form?formCode=${encodeURIComponent(formCode)}`)
      .then(r => r.json())
      .then((j: { items?: FormField[]; error?: string }) => {
        if (!active) return;
        if (j.error) { setFetchError(j.error); setLoading(false); return; }
        const items = j.items ?? [];
        setFields(items);
        setValues(getInitialValues(items, mode, editingAddress, customer));
        setLoading(false);
      })
      .catch(e => {
        if (!active) return;
        setFetchError(e instanceof Error ? e.message : "Failed to load form fields");
        setLoading(false);
      });

    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formCode]);

  // Re-populate values when the address being edited changes
  useEffect(() => {
    if (fields.length === 0) return;
    setValues(getInitialValues(fields, mode, editingAddress, customer));
    setSubmitError("");
  }, [editingAddress, fields, mode, customer]);

  const set = useCallback((code: string, val: string) => {
    setValues(prev => ({ ...prev, [code]: val }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSubmitError("");

    try {
      const token = localStorage.getItem("customer_token");
      const input = buildInput(values, mode, editingAddress);
      const payload: Record<string, unknown> = {
        op:    mode === "edit" ? "updateAddress" : "createAddress",
        token,
        input,
      };
      if (mode === "edit" && editingAddress?.id) {
        payload.id = editingAddress.id;
      }

      const res  = await fetch("/api/account", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json() as { error?: string };
      if (data.error) {
        setSubmitError(data.error);
      } else {
        onSuccess();
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save address");
    } finally {
      setSaving(false);
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin text-gray-400" />
      </div>
    );
  }

  // ── Fetch error ──
  if (fetchError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
        {fetchError}
      </div>
    );
  }

  const contactFields = fields.filter(f => CONTACT_CODES.has(f.code) && f.frontend_input.toUpperCase() !== "HIDDEN");
  const addressFields = fields.filter(f => !CONTACT_CODES.has(f.code) && f.frontend_input.toUpperCase() !== "HIDDEN");
  const hiddenFields  = fields.filter(f => f.frontend_input.toUpperCase() === "HIDDEN");

  return (
    <div>
      <h1 className="text-2xl font-black uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-4 mb-6">
        {mode === "edit" ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}
      </h1>

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Hidden inputs */}
        {hiddenFields.map(f => (
          <input key={f.code} type="hidden" name={f.code} value={values[f.code] ?? ""} readOnly />
        ))}

        {/* Contact Information */}
        {contactFields.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-4 border-b border-gray-100 pb-2">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactFields.map(f => (
                <FieldRenderer
                  key={f.code}
                  field={f}
                  value={values[f.code] ?? ""}
                  onChange={val => set(f.code, val)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Address */}
        {addressFields.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-4 border-b border-gray-100 pb-2">
              Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addressFields.map(f => (
                <FieldRenderer
                  key={f.code}
                  field={f}
                  value={values[f.code] ?? ""}
                  onChange={val => set(f.code, val)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-black hover:bg-[#ed1c24] text-white px-6 py-2.5 rounded font-black text-xs uppercase tracking-wider transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Address"}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold text-gray-600 hover:text-black uppercase tracking-wider transition-colors"
          >
            Back
          </button>
        </div>

      </form>
    </div>
  );
}
