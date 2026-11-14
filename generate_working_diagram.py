import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

def create_diagram():
    # 16:9 ratio high-res figure (1920x1080 at 120 dpi)
    fig, ax = plt.subplots(figsize=(16, 9), dpi=150)
    fig.patch.set_facecolor('#F8FAFC') # Slate-50 background
    ax.set_facecolor('#F8FAFC')

    # Hide standard axes
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 9)
    ax.axis('off')

    # Color Palette
    C_SLATE_900 = '#0F172A'
    C_SLATE_600 = '#475569'
    C_SLATE_400 = '#94A3B8'
    C_BORDER = '#CBD5E1'
    C_CARD_BG = '#FFFFFF'
    C_ORANGE = '#FF5722'
    C_SKY = '#0EA5E9'
    C_AMBER = '#F59E0B'
    C_EMERALD = '#10B981'
    C_PURPLE = '#8B5CF6'

    # Top Header
    ax.text(0.8, 8.4, "FIREPULSE • SYSTEM ARCHITECTURE & WORKING PIPELINE", 
            fontsize=12, fontweight='bold', color=C_ORANGE, family='sans-serif')
    ax.text(0.8, 8.0, "End-to-End Satellite Telemetry Harmonization & Burning Intelligence", 
            fontsize=18, fontweight='bold', color=C_SLATE_900, family='sans-serif')
    ax.text(0.8, 7.65, "From Raw NASA Active Fire Observations to an Interactive 1km Equal-Area Burning Activity Calendar", 
            fontsize=11, color=C_SLATE_600, family='sans-serif')

    # Helper function for rounded cards
    def draw_card(x, y, w, h, title, subtitle="", border_color=C_BORDER, header_color=C_SLATE_900, fill_color=C_CARD_BG):
        # Drop shadow
        shadow = patches.FancyBboxPatch((x+0.04, y-0.04), w, h, boxstyle="round,pad=0.08,rounding_size=0.15",
                                        facecolor='#E2E8F0', edgecolor='none', zorder=1)
        ax.add_patch(shadow)
        
        # Main card
        card = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.15",
                                      facecolor=fill_color, edgecolor=border_color, linewidth=1.5, zorder=2)
        ax.add_patch(card)

        # Title bar
        if title:
            ax.text(x + 0.2, y + h - 0.35, title, fontsize=11, fontweight='bold', color=header_color, zorder=3, family='sans-serif')
        if subtitle:
            ax.text(x + 0.2, y + h - 0.65, subtitle, fontsize=8.5, color=C_SLATE_400, zorder=3, family='sans-serif')

    # Helper function for arrows
    def draw_arrow(x1, y1, x2, y2, color=C_ORANGE, text=""):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->,head_width=0.35,head_length=0.45", 
                                    color=color, lw=2.2, zorder=4))
        if text:
            mx, my = (x1 + x2)/2, (y1 + y2)/2
            ax.text(mx, my + 0.15, text, fontsize=8, fontweight='bold', color=color, ha='center', zorder=5, family='sans-serif')

    # -------------------------------------------------------------
    # STAGE 1: SATELLITE SOURCES (Left Column)
    # -------------------------------------------------------------
    draw_card(0.8, 1.2, 3.2, 5.8, "1. NASA SATELLITE SOURCES", "Official NASA FIRMS Feeds", border_color=C_AMBER)

    # Sub-boxes inside Stage 1
    # MODIS
    sub_modis = patches.FancyBboxPatch((1.0, 5.0), 2.8, 1.4, boxstyle="round,pad=0.04,rounding_size=0.1",
                                       facecolor='#FFFBEB', edgecolor='#FDE68A', lw=1.2, zorder=3)
    ax.add_patch(sub_modis)
    ax.text(1.15, 6.05, "MODIS (Terra & Aqua)", fontsize=9.5, fontweight='bold', color='#B45309', zorder=4)
    ax.text(1.15, 5.75, "• Resolution: 1,000m nominal nadir", fontsize=8, color=C_SLATE_600, zorder=4)
    ax.text(1.15, 5.45, "• Channels: 4um & 11um thermal", fontsize=8, color=C_SLATE_600, zorder=4)
    ax.text(1.15, 5.15, "• Feeds: MODIS_NRT & MODIS_SP", fontsize=8, color=C_SLATE_600, zorder=4)

    # VIIRS Active
    sub_viirs = patches.FancyBboxPatch((1.0, 3.3), 2.8, 1.4, boxstyle="round,pad=0.04,rounding_size=0.1",
                                       facecolor='#F0F9FF', edgecolor='#BAE6FD', lw=1.2, zorder=3)
    ax.add_patch(sub_viirs)
    ax.text(1.15, 4.35, "VIIRS (NOAA-20 & NOAA-21)", fontsize=9.5, fontweight='bold', color='#0369A1', zorder=4)
    ax.text(1.15, 4.05, "• Resolution: 375m I-Band (High-Res)", fontsize=8, color=C_SLATE_600, zorder=4)
    ax.text(1.15, 3.75, "• Next-Gen Operational Satellites", fontsize=8, color=C_SLATE_600, zorder=4)
    ax.text(1.15, 3.45, "• Active: NRT Real-Time Streams", fontsize=8, color=C_SLATE_600, zorder=4)

    # S-NPP Archive
    sub_snpp = patches.FancyBboxPatch((1.0, 1.6), 2.8, 1.4, boxstyle="round,pad=0.04,rounding_size=0.1",
                                      facecolor='#F1F5F9', edgecolor='#CBD5E1', lw=1.2, zorder=3)
    ax.add_patch(sub_snpp)
    ax.text(1.15, 2.65, "VIIRS (Suomi-NPP Archive)", fontsize=9.5, fontweight='bold', color='#334155', zorder=4)
    ax.text(1.15, 2.35, "• Preserved 2012 – Nov 2, 2026", fontsize=8, color=C_SLATE_600, zorder=4)
    ax.text(1.15, 2.05, "• Zero data loss after mission retirement", fontsize=8, color=C_SLATE_600, zorder=4)
    ax.text(1.15, 1.75, "• Provides multi-year baseline data", fontsize=8, color=C_SLATE_600, zorder=4)

    # Arrow 1 -> 2
    draw_arrow(4.1, 4.1, 4.6, 4.1, color=C_ORANGE, text="FIRMS API")

    # -------------------------------------------------------------
    # STAGE 2: INGESTION & FILTER (Column 2)
    # -------------------------------------------------------------
    draw_card(4.7, 1.2, 3.0, 5.8, "2. INGESTION & LAND FILTER", "Clean Telemetry Pipeline", border_color=C_ORANGE)

    p_ingest = [
        ("NASA FIRMS REST Client", "Area CSV chunking (1–5 days)\nDynamic rate-limit handling"),
        ("SHA-256 Local Disk Cache", "Eliminates duplicate API queries\nSub-50ms local replay"),
        ("Global Land-Sea Mask", "Checks coordinates vs coastlines\nRejects 100% of water/oil points"),
        ("Schema Normalization", "Converts divergent MODIS & VIIRS\ninto standard UTC records")
    ]

    for i, (title_p, desc_p) in enumerate(p_ingest):
        y_pos = 5.2 - i * 1.25
        card_sub = patches.FancyBboxPatch((4.9, y_pos), 2.6, 1.05, boxstyle="round,pad=0.03,rounding_size=0.08",
                                          facecolor='#FFF7ED', edgecolor='#FED7AA', lw=1.0, zorder=3)
        ax.add_patch(card_sub)
        ax.text(5.02, y_pos + 0.75, title_p, fontsize=8.8, fontweight='bold', color='#C2410C', zorder=4)
        ax.text(5.02, y_pos + 0.35, desc_p, fontsize=7.5, color=C_SLATE_600, zorder=4)

    # Arrow 2 -> 3
    draw_arrow(7.8, 4.1, 8.3, 4.1, color=C_EMERALD, text="Clean Land Data")

    # -------------------------------------------------------------
    # STAGE 3: 1KM HARMONIZATION ENGINE (Column 3)
    # -------------------------------------------------------------
    draw_card(8.4, 1.2, 3.2, 5.8, "3. 1KM HARMONIZATION", "Spatial Standardization Engine", border_color=C_EMERALD)

    p_harm = [
        ("EPSG:6933 Equal-Area Grid", "World Equal-Area Cylindrical\nEvery cell = exact 1 km² on Earth"),
        ("Deterministic Cell Binning", "col = floor(X/1000), row = floor(Y/1000)\nCell ID = cell_1km_col_row"),
        ("Daily UTC Aggregation", "Groups multiple dots in same cell\nResolves double counting 100%"),
        ("Dual-Sensor Co-Detection", "Flags cells spotted by both sensors\nHigh-confidence ground truth")
    ]

    for i, (title_p, desc_p) in enumerate(p_harm):
        y_pos = 5.2 - i * 1.25
        card_sub = patches.FancyBboxPatch((8.6, y_pos), 2.8, 1.05, boxstyle="round,pad=0.03,rounding_size=0.08",
                                          facecolor='#ECFDF5', edgecolor='#A7F3D0', lw=1.0, zorder=3)
        ax.add_patch(card_sub)
        ax.text(8.72, y_pos + 0.75, title_p, fontsize=8.8, fontweight='bold', color='#047857', zorder=4)
        ax.text(8.72, y_pos + 0.35, desc_p, fontsize=7.5, color=C_SLATE_600, zorder=4)

    # Arrow 3 -> 4
    draw_arrow(11.7, 4.1, 12.2, 4.1, color=C_SKY, text="Harmonized Feed")

    # -------------------------------------------------------------
    # STAGE 4: DATABASE & WEB PLATFORM (Column 4)
    # -------------------------------------------------------------
    draw_card(12.3, 1.2, 3.0, 5.8, "4. ANALYTICS & FRONTEND", "Interactive Intelligence Platform", border_color=C_SKY)

    # DB Box
    card_db = patches.FancyBboxPatch((12.5, 5.1), 2.6, 1.3, boxstyle="round,pad=0.03,rounding_size=0.08",
                                     facecolor='#F8FAFC', edgecolor='#CBD5E1', lw=1.2, zorder=3)
    ax.add_patch(card_db)
    ax.text(12.65, 6.05, "SQLite / PostgreSQL", fontsize=9.2, fontweight='bold', color=C_SLATE_900, zorder=4)
    ax.text(12.65, 5.75, "• 24,126+ Verified Observations", fontsize=7.8, color=C_SLATE_600, zorder=4)
    ax.text(12.65, 5.45, "• 18,816+ 1km Grid Cells (Land Only)", fontsize=7.8, color=C_SLATE_600, zorder=4)
    ax.text(12.65, 5.18, "• Sub-50ms Indexed Query Latency", fontsize=7.8, color=C_SLATE_600, zorder=4)

    # Frontend Map
    card_map = patches.FancyBboxPatch((12.5, 3.4), 2.6, 1.4, boxstyle="round,pad=0.03,rounding_size=0.08",
                                      facecolor='#EFF6FF', edgecolor='#BFDBFE', lw=1.2, zorder=3)
    ax.add_patch(card_map)
    ax.text(12.65, 4.45, "Leaflet 1km Fire Map", fontsize=9.2, fontweight='bold', color='#1D4ED8', zorder=4)
    ax.text(12.65, 4.15, "• 1km Equal-Area Cell Overlays", fontsize=7.8, color=C_SLATE_600, zorder=4)
    ax.text(12.65, 3.85, "• Instant Hover Telemetry Tooltips", fontsize=7.8, color=C_SLATE_600, zorder=4)
    ax.text(12.65, 3.55, "• Smooth 60 FPS Zoom Clustering", fontsize=7.8, color=C_SLATE_600, zorder=4)

    # Burning Calendar
    card_cal = patches.FancyBboxPatch((12.5, 1.6), 2.6, 1.5, boxstyle="round,pad=0.03,rounding_size=0.08",
                                      facecolor='#FAF5FF', edgecolor='#E9D5FF', lw=1.2, zorder=3)
    ax.add_patch(card_cal)
    ax.text(12.65, 2.75, "Burning Activity Calendar", fontsize=9.2, fontweight='bold', color='#7E22CE', zorder=4)
    ax.text(12.65, 2.45, "• Multi-Year Annual Matrix (2021–26)", fontsize=7.8, color=C_SLATE_600, zorder=4)
    ax.text(12.65, 2.15, "• 5-Year Historical Medians", fontsize=7.8, color=C_SLATE_600, zorder=4)
    ax.text(12.65, 1.85, "• Uncharacteristic Fire Anomaly Alert", fontsize=7.8, color=C_SLATE_600, zorder=4)

    # Bottom Footer Attribution
    ax.text(8.0, 0.45, "Team Virtual Warriors  •  NASA Space Apps Challenge 2026  •  Challenge: Harmonization of MODIS and VIIRS Hot Spots", 
            fontsize=9.5, fontweight='bold', color=C_SLATE_600, ha='center', family='sans-serif')

    out_file = "FirePulse_Working_Diagram.png"
    plt.tight_layout()
    plt.savefig(out_file, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Diagram successfully created at: {os.path.abspath(out_file)}")

if __name__ == "__main__":
    create_diagram()
