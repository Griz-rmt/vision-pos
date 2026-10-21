# ==============================================================================
# VISIONPOS – KASIR OTOMATIS AI YOLO  |  streamlit_app.py
# Versi lengkap & siap pakai – standalone Streamlit app
#
# Cara menjalankan:
#   pip install -r requirements_streamlit.txt
#   streamlit run streamlit_app.py
#
# Catatan: letakkan best.pt di folder yang sama dengan file ini.
# ==============================================================================

import streamlit as st
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import pandas as pd
import datetime
import os
import io
import json

# ── Konfigurasi Halaman ───────────────────────────────────────────────────────
st.set_page_config(
    page_title="VisionPOS – Kasir Otomatis AI YOLO",
    page_icon="🛒",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ─────────────────────────────────────────────────────────────────
st.markdown(
    """
    <style>
        /* Sembunyikan hamburger & footer bawaan Streamlit */
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}

        /* Warna aksen hijau emerald */
        .stButton > button[kind="primary"] {
            background-color: #059669;
            border: none;
        }
        .stButton > button[kind="primary"]:hover {
            background-color: #047857;
        }

        /* Badge label status */
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
        }
        .badge-green  { background:#dcfce7; color:#166534; }
        .badge-blue   { background:#dbeafe; color:#1d4ed8; }
        .badge-orange { background:#ffedd5; color:#c2410c; }
        .badge-gray   { background:#f1f5f9; color:#475569; }

        /* Box total bayar */
        .total-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 14px 18px;
            margin-bottom: 12px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 13px;
        }
        .total-grand {
            display: flex;
            justify-content: space-between;
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed #cbd5e1;
        }
        .total-grand span { color: #059669; }
    </style>
    """,
    unsafe_allow_html=True,
)

# ── 1. KATALOG PRODUK DEFAULT (sinkron dengan React initialProducts.ts) ────────
DEFAULT_PRODUCTS = {
    "indomie_goreng":   {"name": "Indomie Mi Goreng 85g",          "price": 3_500,  "category": "Makanan Instan"},
    "oreo_box":         {"name": "Oreo Vanilla Box 123g",           "price": 11_500, "category": "Biskuit & Snack"},
    "cadbury_fingers":  {"name": "Cadbury Fingers 114g",            "price": 24_000, "category": "Cokelat"},
    "cup_noodles":      {"name": "Nissin Cup Noodles Seafood",       "price": 14_500, "category": "Makanan Instan"},
    "maggi_noodles":    {"name": "Maggi 2-Minute Noodles Chicken",   "price": 4_500,  "category": "Makanan Instan"},
    "loacker_wafer":    {"name": "Loacker Quadratini 125g",          "price": 32_000, "category": "Biskuit & Snack"},
    "choco_leibniz":    {"name": "Choco Leibniz Butter Biscuits",    "price": 38_000, "category": "Biskuit & Snack"},
    "tortilla_wraps":   {"name": "Mission Tortilla Wraps 6pcs",      "price": 28_500, "category": "Makanan"},
    "coca_cola":        {"name": "Coca-Cola Kaleng 330ml",           "price": 8_000,  "category": "Minuman Dingin"},
    "sanpellegrino":    {"name": "S.Pellegrino Sparkling 500ml",     "price": 22_000, "category": "Minuman"},
    "nestea_lemon":     {"name": "Nestea Lemon Tea 500ml",           "price": 7_500,  "category": "Minuman Teh"},
    "evian_water":      {"name": "Evian Mineral Water 500ml",        "price": 18_500, "category": "Air Mineral"},
    "ito_en_tea":       {"name": "Ito En Green Tea 500ml",           "price": 19_500, "category": "Minuman Teh"},
    "sparkling_water":  {"name": "S.Pellegrino Sparkling Water 1L",  "price": 35_000, "category": "Air Mineral"},
}

# ── 2. SESSION STATE INIT ─────────────────────────────────────────────────────
if "products"     not in st.session_state: st.session_state.products     = DEFAULT_PRODUCTS.copy()
if "cart"         not in st.session_state: st.session_state.cart         = {}   # {yolo_class: qty}
if "transactions" not in st.session_state: st.session_state.transactions = []
if "active_tab"   not in st.session_state: st.session_state.active_tab   = "kasir"
if "include_tax"  not in st.session_state: st.session_state.include_tax  = True

# ── 3. FUNGSI UTILITAS ────────────────────────────────────────────────────────
def fmt_rp(amount: float) -> str:
    """Format angka ke Rupiah: 15000 → 'Rp 15.000'"""
    return f"Rp {int(amount):,}".replace(",", ".")


def gen_trx_number() -> str:
    now = datetime.datetime.now()
    suffix = np.random.randint(1000, 9999)
    return f"TRX-{now.strftime('%y%m%d')}-{suffix}"


def draw_detections_on_image(
    img: Image.Image,
    detections: list,
    products: dict,
) -> Image.Image:
    """Gambar bounding box & label di atas PIL Image."""
    draw = ImageDraw.Draw(img)
    w, h = img.size

    # Coba muat font; fallback ke default jika tidak tersedia
    try:
        font = ImageFont.truetype("arial.ttf", 14)
        font_small = ImageFont.truetype("arial.ttf", 12)
    except Exception:
        font = ImageFont.load_default()
        font_small = font

    COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

    for idx, det in enumerate(detections):
        cls   = det["class"]
        conf  = det["confidence"]
        bbox  = det["bbox"]  # [ymin_n, xmin_n, ymax_n, xmax_n] ternormalisasi

        # Denormalisasi ke piksel
        y1 = int(bbox[0] * h);  x1 = int(bbox[1] * w)
        y2 = int(bbox[2] * h);  x2 = int(bbox[3] * w)

        color = COLORS[idx % len(COLORS)]
        draw.rectangle([x1, y1, x2, y2], outline=color, width=3)

        prod_info  = products.get(cls)
        prod_label = prod_info["name"] if prod_info else cls.replace("_", " ").title()
        label_txt  = f"{prod_label} {int(conf * 100)}%"

        # Kotak latar label
        label_w = len(label_txt) * 7 + 12
        label_h = 20
        lx1, ly1 = x1, max(0, y1 - label_h)
        draw.rectangle([lx1, ly1, lx1 + label_w, lx1 + label_h - (label_h - (y1 - ly1))], fill=color)  # noqa
        # Gambar ulang supaya rapi
        draw.rectangle([x1, max(0, y1 - label_h), x1 + label_w, y1], fill=color)
        draw.text((x1 + 4, max(0, y1 - 16)), label_txt, fill="#FFFFFF", font=font_small)

    return img


# ── 4. LOAD MODEL YOLO ─────────────────────────────────────────────────────────
@st.cache_resource(show_spinner="Memuat model YOLO…")
def load_yolo_model(model_path: str = "best.pt"):
    try:
        from ultralytics import YOLO  # type: ignore

        if os.path.exists(model_path):
            mdl = YOLO(model_path)
            return mdl, True, f"✅ Model kustom **{model_path}** berhasil dimuat ({len(mdl.names)} kelas)."
        else:
            # Cari file .pt lain di folder yang sama
            pt_files = [f for f in os.listdir(".") if f.endswith(".pt")]
            if pt_files:
                mdl = YOLO(pt_files[0])
                return mdl, True, (
                    f"✅ Memuat **{pt_files[0]}** (ditemukan otomatis, "
                    f"'{model_path}' tidak ada). {len(mdl.names)} kelas."
                )
            else:
                mdl = YOLO("yolov8n.pt")
                return mdl, False, (
                    f"⚠️ `{model_path}` tidak ditemukan & tidak ada file .pt lain. "
                    "Menggunakan fallback **yolov8n.pt**."
                )
    except ImportError:
        return None, False, "❌ `ultralytics` belum terinstall. Jalankan: `pip install ultralytics`"
    except Exception as exc:
        return None, False, f"❌ Gagal memuat model: {exc}"


# ── 5. SIDEBAR ─────────────────────────────────────────────────────────────────
with st.sidebar:
    st.image(
        "https://img.icons8.com/fluency/96/shopping-cart.png",
        width=54,
    )
    st.title("VisionPOS")
    st.caption("Kasir Otomatis AI · YOLO")
    st.divider()

    # Navigasi Tab
    nav_choice = st.radio(
        "📌 Navigasi",
        ["🛒 Kasir & Scan", "📦 Katalog Produk", "📑 Riwayat Transaksi"],
        index=["kasir", "katalog", "riwayat"].index(st.session_state.active_tab)
        if st.session_state.active_tab in ["kasir", "katalog", "riwayat"]
        else 0,
        label_visibility="collapsed",
    )
    nav_map = {
        "🛒 Kasir & Scan": "kasir",
        "📦 Katalog Produk": "katalog",
        "📑 Riwayat Transaksi": "riwayat",
    }
    st.session_state.active_tab = nav_map[nav_choice]

    st.divider()

    # Pengaturan Model
    with st.expander("⚙️ Pengaturan Model YOLO", expanded=True):
        # Deteksi otomatis nama file model yang tersedia di folder
        _default_model = (
            "my_model.pt" if os.path.exists("my_model.pt")
            else "best.pt" if os.path.exists("best.pt")
            else "yolov8n.pt"
        )
        model_file    = st.text_input("File Model (.pt)", value=_default_model)
        conf_thresh   = st.slider("Confidence", 0.25, 0.95, 0.50, 0.05,
                                  help="Objek dengan confidence di bawah ini diabaikan.")
        auto_add_cart = st.checkbox("Auto masuk keranjang saat scan", value=True)

    yolo_model, is_custom, model_status = load_yolo_model(model_file)

    if is_custom:
        st.success(model_status)
    else:
        st.info(model_status)

    # Kelas model
    if yolo_model and hasattr(yolo_model, "names"):
        with st.expander(f"🏷️ Label Model ({len(yolo_model.names)} kelas)"):
            st.json(yolo_model.names)

            if st.button("🔄 Sinkronkan ke Katalog Kasir", use_container_width=True):
                added = 0
                for cls_name in yolo_model.names.values():
                    if cls_name not in st.session_state.products:
                        readable = cls_name.replace("_", " ").title()
                        st.session_state.products[cls_name] = {
                            "name": readable,
                            "price": 10_000,
                            "category": "Produk AI YOLO",
                        }
                        added += 1
                if added:
                    st.success(f"✅ {added} produk baru ditambahkan ke katalog.")
                    st.rerun()
                else:
                    st.info("Semua kelas sudah ada di katalog.")

    st.divider()
    st.caption("Versi 2.0 · VisionPOS · 2026")


# ==============================================================================
# TAB: KASIR & SCAN
# ==============================================================================
if st.session_state.active_tab == "kasir":
    st.title("🛒 VisionPOS – Kasir Otomatis AI YOLO")
    st.caption("Scan produk via kamera atau upload foto, lalu selesaikan transaksi.")

    col_cam, col_cart = st.columns([7, 5], gap="large")

    # ── KOLOM KAMERA ──────────────────────────────────────────────────────────
    with col_cam:
        st.subheader("📹 Area Pindai")

        source = st.radio(
            "Sumber Gambar:",
            ["📷 Kamera Webcam", "🖼️ Upload Foto"],
            horizontal=True,
            label_visibility="collapsed",
        )

        image_to_process = None

        if "📷" in source:
            cam_img = st.camera_input(
                "Arahkan produk ke kamera, lalu klik Capture",
                label_visibility="visible",
            )
            if cam_img:
                image_to_process = Image.open(cam_img).convert("RGB")
        else:
            uploaded = st.file_uploader(
                "Unggah foto tray belanjaan",
                type=["jpg", "jpeg", "png", "webp"],
            )
            if uploaded:
                image_to_process = Image.open(uploaded).convert("RGB")

        detected_in_frame: list = []

        if image_to_process and yolo_model:
            with st.spinner("Mendeteksi produk…"):
                results = yolo_model.predict(
                    source=image_to_process,
                    conf=conf_thresh,
                    verbose=False,
                )

            img_h, img_w = image_to_process.size[1], image_to_process.size[0]

            for r in results:
                for box in r.boxes:
                    cls_id  = int(box.cls[0])
                    cls_nm  = yolo_model.names[cls_id]
                    conf_v  = float(box.conf[0])
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    detected_in_frame.append({
                        "class":      cls_nm,
                        "confidence": conf_v,
                        "bbox":       [y1 / img_h, x1 / img_w, y2 / img_h, x2 / img_w],
                    })

            # Gambar bbox
            img_drawn = draw_detections_on_image(
                image_to_process.copy(), detected_in_frame, st.session_state.products
            )
            st.image(
                img_drawn,
                caption=f"Hasil Deteksi YOLO – {len(detected_in_frame)} objek terdeteksi",
                use_container_width=True,
            )

            if not image_to_process and yolo_model is None:
                st.warning("Model YOLO belum siap. Periksa sidebar pengaturan model.")

            # Ringkasan deteksi
            if detected_in_frame:
                st.markdown(f"**✨ {len(detected_in_frame)} produk terdeteksi di frame:**")

                det_cols = st.columns(min(len(detected_in_frame), 3))
                for i, det in enumerate(detected_in_frame):
                    prod_info = st.session_state.products.get(det["class"])
                    label     = prod_info["name"] if prod_info else det["class"]
                    price_str = fmt_rp(prod_info["price"]) if prod_info else "—"

                    with det_cols[i % len(det_cols)]:
                        st.markdown(
                            f"""
                            <div style="border:1px solid #e2e8f0; border-radius:10px;
                                        padding:10px 12px; margin-bottom:6px; background:#f8fafc;">
                              <div style="font-size:12px;font-weight:700;color:#0f172a;">{label}</div>
                              <div style="font-size:11px;color:#64748b;">
                                  conf: <b>{int(det['confidence']*100)}%</b> &nbsp;·&nbsp; {price_str}
                              </div>
                            </div>
                            """,
                            unsafe_allow_html=True,
                        )

                st.divider()
                btn1, btn2 = st.columns([2, 1])
                with btn1:
                    if st.button(
                        f"➕ Masukkan Semua ({len(detected_in_frame)}) ke Keranjang",
                        type="primary",
                        use_container_width=True,
                    ):
                        for det in detected_in_frame:
                            cls = det["class"]
                            st.session_state.cart[cls] = st.session_state.cart.get(cls, 0) + 1
                        st.toast(f"{len(detected_in_frame)} barang ditambahkan ke keranjang!", icon="🛒")
                        st.rerun()

                with btn2:
                    if st.button("🔁 Scan Ulang", use_container_width=True):
                        st.rerun()

        elif image_to_process and not yolo_model:
            st.error("Model YOLO tidak tersedia. Periksa pengaturan di sidebar.")

    # ── KOLOM KERANJANG ───────────────────────────────────────────────────────
    with col_cart:
        st.subheader("🧾 Keranjang & Struk")

        # Tambah manual dari katalog
        with st.expander("🔍 Tambah Produk Manual", expanded=False):
            search_q   = st.text_input("Cari nama / kelas produk…", key="manual_search")
            matches    = [
                (cls, info) for cls, info in st.session_state.products.items()
                if search_q.lower() in info["name"].lower() or search_q.lower() in cls.lower()
            ] if search_q else []

            for cls, info in matches[:6]:
                c1, c2 = st.columns([3, 1])
                with c1:
                    st.markdown(
                        f"<span style='font-size:12px;'><b>{info['name']}</b> "
                        f"<span style='color:#64748b;font-size:11px;'>· {fmt_rp(info['price'])}</span></span>",
                        unsafe_allow_html=True,
                    )
                with c2:
                    if st.button("+ Tambah", key=f"manual_{cls}", use_container_width=True):
                        st.session_state.cart[cls] = st.session_state.cart.get(cls, 0) + 1
                        st.rerun()

        # Daftar item di keranjang
        if not st.session_state.cart:
            st.info("Keranjang kosong. Scan produk atau tambah manual.")
        else:
            subtotal = 0
            items_to_delete = []

            for cls, qty in list(st.session_state.cart.items()):
                prod     = st.session_state.products.get(cls, {"name": cls, "price": 10_000, "category": "Lainnya"})
                item_ttl = prod["price"] * qty
                subtotal += item_ttl

                c1, c2, c3, c4, c5 = st.columns([5, 1, 1, 3, 1])
                with c1:
                    st.markdown(
                        f"<span style='font-size:12px;font-weight:600;'>{prod['name']}</span>"
                        f"<br><span style='font-size:10px;color:#94a3b8;'>{fmt_rp(prod['price'])} / pcs</span>",
                        unsafe_allow_html=True,
                    )
                with c2:
                    if st.button("−", key=f"dec_{cls}"):
                        new_qty = st.session_state.cart[cls] - 1
                        if new_qty <= 0:
                            items_to_delete.append(cls)
                        else:
                            st.session_state.cart[cls] = new_qty
                        st.rerun()
                with c3:
                    st.markdown(
                        f"<div style='text-align:center;font-weight:700;font-size:13px;padding-top:6px;'>{qty}</div>",
                        unsafe_allow_html=True,
                    )
                with c4:
                    st.markdown(
                        f"<div style='text-align:right;font-size:13px;font-weight:600;padding-top:6px;'>{fmt_rp(item_ttl)}</div>",
                        unsafe_allow_html=True,
                    )
                with c5:
                    if st.button("✕", key=f"del_{cls}", help="Hapus dari keranjang"):
                        items_to_delete.append(cls)
                        st.rerun()

            for cls in items_to_delete:
                st.session_state.cart.pop(cls, None)

            st.divider()

            # PPN & Total
            inc_tax    = st.checkbox("Kenakan PPN 11%", value=st.session_state.include_tax, key="tax_cb")
            st.session_state.include_tax = inc_tax
            tax_amount = int(subtotal * 0.11) if inc_tax else 0
            total_bill = subtotal + tax_amount

            st.markdown(
                f"""
                <div class="total-box">
                    <div class="total-row">
                        <span>Subtotal</span>
                        <b>{fmt_rp(subtotal)}</b>
                    </div>
                    <div class="total-row">
                        <span>PPN (11%)</span>
                        <span>{fmt_rp(tax_amount)}</span>
                    </div>
                    <div class="total-grand">
                        <span>TOTAL BAYAR</span>
                        <span>{fmt_rp(total_bill)}</span>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

            # Metode Pembayaran
            pay_method = st.radio(
                "Metode Pembayaran:",
                ["QRIS", "Tunai", "Debit / Kredit", "E-Wallet"],
                horizontal=True,
                key="pay_method",
            )

            cash_given = total_bill
            change     = 0
            if pay_method == "Tunai":
                cash_given = st.number_input(
                    "Nominal Uang Diterima (Rp)",
                    min_value=int(total_bill),
                    value=int(total_bill),
                    step=5_000,
                )
                change = int(cash_given) - int(total_bill)
                if change > 0:
                    st.success(f"💵 Kembalian: **{fmt_rp(change)}**")
                elif change == 0:
                    st.info("Uang pas – tidak ada kembalian.")

            # Tombol Selesaikan Transaksi
            col_pay, col_clr = st.columns([3, 1])
            with col_pay:
                if st.button(
                    "💳 Selesaikan Transaksi & Cetak Struk",
                    type="primary",
                    use_container_width=True,
                ):
                    trx_no = gen_trx_number()
                    trx    = {
                        "id":       trx_no,
                        "time":     datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "subtotal": subtotal,
                        "tax":      tax_amount,
                        "total":    total_bill,
                        "method":   pay_method,
                        "paid":     int(cash_given),
                        "change":   change,
                        "items":    {
                            cls: {
                                "qty":   qty,
                                "name":  st.session_state.products.get(cls, {}).get("name", cls),
                                "price": st.session_state.products.get(cls, {}).get("price", 10_000),
                            }
                            for cls, qty in st.session_state.cart.items()
                        },
                    }
                    st.session_state.transactions.insert(0, trx)

                    # Tampilkan struk di modal (expander)
                    # Siapkan baris tunai di luar f-string untuk menghindari f-string bersarang
                    cash_line = (
                        f"<div>Tunai: {fmt_rp(cash_given)} | Kembali: {fmt_rp(change)}</div>"
                        if pay_method == "Tunai" else ""
                    )
                    # Siapkan baris item struk
                    items_html = "".join(
                        f"<div style='display:flex;justify-content:space-between;'>"
                        f"<span>{v['name']} x{v['qty']}</span>"
                        f"<span>{fmt_rp(v['price'] * v['qty'])}</span></div>"
                        for v in trx["items"].values()
                    )
                    with st.expander("🧾 Struk Transaksi – Klik untuk Buka", expanded=True):
                        st.markdown(
                            f"""
                            <div style="font-family:monospace; font-size:12px;
                                        background:#0f172a; color:#f1f5f9;
                                        padding:20px; border-radius:12px;
                                        line-height:1.8;">
                              <div style="text-align:center; font-size:15px; font-weight:700; color:#34d399;">
                                  🛒 VISIONPOS
                              </div>
                              <div style="text-align:center; color:#94a3b8; font-size:11px;">
                                  Kasir Otomatis AI YOLO
                              </div>
                              <div style="text-align:center; color:#64748b; font-size:10px; margin-bottom:12px;">
                                  {trx['time']}
                              </div>
                              <div style="border-top:1px dashed #334155; margin:8px 0;"></div>
                              <div><b>No. Nota:</b> {trx_no}</div>
                              <div><b>Metode  :</b> {pay_method}</div>
                              <div style="border-top:1px dashed #334155; margin:8px 0;"></div>
                              {items_html}
                              <div style="border-top:1px dashed #334155; margin:8px 0;"></div>
                              <div style="display:flex;justify-content:space-between;">
                                  <span>Subtotal</span><span>{fmt_rp(subtotal)}</span>
                              </div>
                              <div style="display:flex;justify-content:space-between;">
                                  <span>PPN 11%</span><span>{fmt_rp(tax_amount)}</span>
                              </div>
                              <div style="display:flex;justify-content:space-between;
                                          font-size:15px;font-weight:700;color:#34d399;
                                          margin-top:6px;padding-top:6px;
                                          border-top:1px dashed #334155;">
                                  <span>TOTAL</span><span>{fmt_rp(total_bill)}</span>
                              </div>
                              {cash_line}
                              <div style="text-align:center; margin-top:14px; color:#64748b; font-size:10px;">
                                  Terima kasih telah berbelanja! 🙏
                              </div>
                            </div>
                            """,
                            unsafe_allow_html=True,
                        )

                        # Download struk .txt
                        receipt_txt = (
                            f"========== STRUK VISIONPOS ==========\n"
                            f"No. Nota : {trx_no}\n"
                            f"Waktu    : {trx['time']}\n"
                            f"Metode   : {pay_method}\n"
                            f"-------------------------------------\n"
                        )
                        for v in trx["items"].values():
                            receipt_txt += f"{v['name']:<30} x{v['qty']}  {fmt_rp(v['price']*v['qty'])}\n"
                        receipt_txt += (
                            f"-------------------------------------\n"
                            f"Subtotal : {fmt_rp(subtotal)}\n"
                            f"PPN 11%  : {fmt_rp(tax_amount)}\n"
                            f"TOTAL    : {fmt_rp(total_bill)}\n"
                        )
                        if pay_method == "Tunai":
                            receipt_txt += f"Tunai    : {fmt_rp(cash_given)}\nKembali  : {fmt_rp(change)}\n"
                        receipt_txt += "=====================================\nTerima kasih!\n"

                        st.download_button(
                            "⬇️ Unduh Struk (.txt)",
                            data=receipt_txt.encode("utf-8"),
                            file_name=f"struk_{trx_no}.txt",
                            mime="text/plain",
                            use_container_width=True,
                        )

                    # Reset keranjang
                    st.session_state.cart = {}
                    st.balloons()
                    st.rerun()

            with col_clr:
                if st.button("🗑️ Kosongkan", use_container_width=True, help="Hapus semua item dari keranjang"):
                    st.session_state.cart = {}
                    st.rerun()


# ==============================================================================
# TAB: KATALOG PRODUK
# ==============================================================================
elif st.session_state.active_tab == "katalog":
    st.title("📦 Katalog Produk")
    st.caption("Kelola daftar produk dan harganya. Kelas YOLO dipakai untuk memetakan deteksi ke produk.")

    # Search + filter
    col_s, col_f = st.columns([3, 1])
    with col_s:
        search_cat  = st.text_input("🔍 Cari produk…", placeholder="Nama, kelas, atau kategori")
    with col_f:
        categories = sorted({v["category"] for v in st.session_state.products.values()})
        cat_filter = st.selectbox("Kategori", ["Semua"] + categories)

    filtered = {
        cls: info for cls, info in st.session_state.products.items()
        if (
            (not search_cat or
             search_cat.lower() in info["name"].lower() or
             search_cat.lower() in cls.lower() or
             search_cat.lower() in info["category"].lower())
            and
            (cat_filter == "Semua" or info["category"] == cat_filter)
        )
    }

    # Tabel produk
    if filtered:
        rows = []
        for cls, info in filtered.items():
            rows.append({
                "Kelas YOLO":  cls,
                "Nama Produk": info["name"],
                "Harga":       fmt_rp(info["price"]),
                "Kategori":    info["category"],
            })
        st.dataframe(
            pd.DataFrame(rows),
            use_container_width=True,
            hide_index=True,
        )
        st.caption(f"Menampilkan {len(filtered)} dari {len(st.session_state.products)} produk")
    else:
        st.info("Tidak ada produk yang cocok dengan filter.")

    st.divider()

    # Form tambah produk
    with st.expander("➕ Tambah Produk Baru", expanded=False):
        with st.form("add_product_form", clear_on_submit=True):
            f1, f2 = st.columns(2)
            with f1:
                new_cls  = st.text_input("Kelas YOLO (snake_case)", placeholder="contoh: indomie_goreng")
                new_name = st.text_input("Nama Produk", placeholder="Indomie Mi Goreng 85g")
            with f2:
                new_price = st.number_input("Harga (Rp)", min_value=100, value=10_000, step=500)
                new_cat   = st.text_input("Kategori", placeholder="Makanan Instan")

            submitted = st.form_submit_button("Simpan Produk", type="primary", use_container_width=True)
            if submitted:
                if not new_cls or not new_name:
                    st.error("Kelas YOLO dan Nama Produk wajib diisi.")
                elif new_cls in st.session_state.products:
                    st.warning(f"Kelas `{new_cls}` sudah ada. Gunakan nama yang berbeda.")
                else:
                    st.session_state.products[new_cls] = {
                        "name":     new_name,
                        "price":    int(new_price),
                        "category": new_cat or "Lainnya",
                    }
                    st.success(f"✅ Produk **{new_name}** berhasil ditambahkan!")
                    st.rerun()

    # Reset ke default
    if st.button("🔄 Reset Katalog ke Default", help="Kembalikan katalog ke 14 produk bawaan"):
        st.session_state.products = DEFAULT_PRODUCTS.copy()
        st.success("Katalog dikembalikan ke default.")
        st.rerun()


# ==============================================================================
# TAB: RIWAYAT TRANSAKSI
# ==============================================================================
elif st.session_state.active_tab == "riwayat":
    st.title("📑 Riwayat Transaksi")

    if not st.session_state.transactions:
        st.info("Belum ada transaksi. Selesaikan pembelian di tab Kasir terlebih dahulu.")
    else:
        # Ringkasan statistik
        total_rev = sum(t["total"] for t in st.session_state.transactions)
        total_trx = len(st.session_state.transactions)
        avg_basket = total_rev / total_trx if total_trx else 0

        m1, m2, m3 = st.columns(3)
        m1.metric("Total Pendapatan", fmt_rp(total_rev))
        m2.metric("Jumlah Transaksi", total_trx)
        m3.metric("Rata-rata Belanja", fmt_rp(avg_basket))

        st.divider()

        # Tabel riwayat
        rows = []
        for t in st.session_state.transactions:
            rows.append({
                "No. Nota":    t["id"],
                "Waktu":       t["time"],
                "Metode":      t["method"],
                "Total Bayar": fmt_rp(t["total"]),
                "Jumlah Item": sum(v["qty"] for v in t["items"].values()),
            })
        st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

        # Detail transaksi yang dipilih
        trx_ids = [t["id"] for t in st.session_state.transactions]
        sel_id  = st.selectbox("Lihat detail transaksi:", trx_ids)
        sel_trx = next((t for t in st.session_state.transactions if t["id"] == sel_id), None)

        if sel_trx:
            with st.expander(f"📄 Detail {sel_id}", expanded=True):
                detail_rows = [
                    {
                        "Produk":    v["name"],
                        "Qty":       v["qty"],
                        "Harga Sat": fmt_rp(v["price"]),
                        "Subtotal":  fmt_rp(v["price"] * v["qty"]),
                    }
                    for v in sel_trx["items"].values()
                ]
                st.dataframe(pd.DataFrame(detail_rows), use_container_width=True, hide_index=True)
                d1, d2, d3 = st.columns(3)
                d1.metric("Subtotal", fmt_rp(sel_trx["subtotal"]))
                d2.metric("PPN",      fmt_rp(sel_trx["tax"]))
                d3.metric("Total",    fmt_rp(sel_trx["total"]))

        # Export ke CSV
        if st.button("⬇️ Export Riwayat ke CSV"):
            csv_df = pd.DataFrame(rows)
            st.download_button(
                "Download CSV",
                data=csv_df.to_csv(index=False).encode("utf-8"),
                file_name=f"riwayat_transaksi_{datetime.date.today()}.csv",
                mime="text/csv",
                use_container_width=True,
            )
