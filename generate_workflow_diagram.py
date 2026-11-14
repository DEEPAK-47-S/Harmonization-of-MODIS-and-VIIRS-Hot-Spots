import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

def create_workflow_diagram():
    # 16:9 widescreen figure (1920x1080 at 150 dpi)
    fig, ax = plt.subplots(figsize=(16, 9), dpi=150)
    fig.patch.set_facecolor('#F8FAFC') # Slate-50 background
    ax.set_facecolor('#F8FAFC')

    ax.set_xlim(0, 16)
    ax.set_ylim(0, 9)
    ax.axis('off')

    # Color Palette
    C_SLATE_900 = '#0F172A'
    C_SLATE_700 = '#334155'
    C_SLATE_500 = '#64748B'
    C_SLATE_400 = '#94A3B8'
    C_ORANGE = '#FF5722'
    C_AMBER = '#F59E0B'
    C_EMERALD = '#10B981'
    C_SKY = '#0EA5E9'
    C_PURPLE = '#8B5CF6'
    C_RED = '#EF4444'

    # Header
    ax.text(0.8, 8.45, "FIREPULSE • STEP-BY-STEP WORKFLOW DIAGRAM", 
            fontsize=12, fontweight='bold', color=C_ORANGE, family='sans-serif')
    ax.text(0.8, 8.05, "Operational Processing Flow: From Satellite Telemetry to Fire Intelligence", 
            fontsize=17, fontweight='bold', color=C_SLATE_900, family='sans-serif')
    ax.text(0.8, 7.7, "Sequential decision logic, data validation, mathematical projection, and analytical delivery", 
            fontsize=10.5, color=C_SLATE_500, family='sans-serif')

    # Helper: draw process step box
    def draw_step(x, y, w, h, step_num, title, details, color=C_ORANGE, bg_color='#FFFFFF', border_color='#CBD5E1'):
        # Drop shadow
        shadow = patches.FancyBboxPatch((x+0.04, y-0.04), w, h, boxstyle="round,pad=0.06,rounding_size=0.12",
                                        facecolor='#E2E8F0', edgecolor='none', zorder=1)
        ax.add_patch(shadow)

        # Card
        card = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.06,rounding_size=0.12",
                                      facecolor=bg_color, edgecolor=border_color, linewidth=1.5, zorder=2)
        ax.add_patch(card)

        # Step badge
        badge = patches.FancyBboxPatch((x + 0.15, y + h - 0.42), 0.7, 0.28, boxstyle="round,pad=0.02,rounding_size=0.06",
                                       facecolor=color, edgecolor='none', zorder=3)
        ax.add_patch(badge)
        ax.text(x + 0.5, y + h - 0.28, f"STEP {step_num}", fontsize=7.5, fontweight='bold', color='#FFFFFF', 
                ha='center', va='center', zorder=4, family='sans-serif')

        # Title
        ax.text(x + 0.95, y + h - 0.28, title, fontsize=10, fontweight='bold', color=C_SLATE_900, 
                va='center', zorder=4, family='sans-serif')

        # Details bullets
        for i, line in enumerate(details):
            ax.text(x + 0.2, y + h - 0.65 - (i * 0.24), f"• {line}", fontsize=8, color=C_SLATE_700, zorder=4, family='sans-serif')

    # Helper: draw connecting arrow
    def draw_conn(x1, y1, x2, y2, color=C_SLATE_400, label=""):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->,head_width=0.3,head_length=0.4", 
                                    color=color, lw=2.0, zorder=5))
        if label:
            mx, my = (x1 + x2)/2, (y1 + y2)/2
            ax.text(mx, my + 0.12, label, fontsize=7.5, fontweight='bold', color=color, ha='center', zorder=6, family='sans-serif')

    # -------------------------------------------------------------
    # TOP ROW: STEPS 1 TO 4 (Left to Right)
    # -------------------------------------------------------------
    y_top = 4.8
    card_w = 3.2
    card_h = 2.4

    # STEP 1: Ingestion Trigger
    draw_step(0.8, y_top, card_w, card_h, "1", "Data Acquisition Trigger", [
        "User chooses AOI (World / Country / BBox)",
        "Or automated 3-hour refresh activates",
        "API calls official NASA FIRMS endpoints",
        "Sources: MODIS (NRT) + VIIRS NOAA-20/21",
        "Preserves Suomi-NPP historical records"
    ], color=C_ORANGE, border_color='#FDBA74')

    draw_conn(4.1, y_top + 1.2, 4.6, y_top + 1.2, color=C_ORANGE, label="Raw CSV")

    # STEP 2: Cache & Normalization
    draw_step(4.7, y_top, card_w, card_h, "2", "Cache & Normalization", [
        "Computes SHA-256 hash of raw chunk",
        "Hits local disk cache if already stored",
        "Parses UTC acquisition date & HHMM time",
        "Validates coordinates in [-90,90], [-180,180]",
        "Extracts thermal FRP (MW) & brightness"
    ], color=C_AMBER, border_color='#FDE68A')

    draw_conn(8.0, y_top + 1.2, 8.5, y_top + 1.2, color=C_AMBER, label="Verified")

    # STEP 3: Land-Mask Verification
    draw_step(8.6, y_top, card_w, card_h, "3", "Global Land-Mask Filter", [
        "Checks (lat, lon) against global land boundary",
        "Condition: Is coordinate on land?",
        "  - IF NO: Discard offshore flaring & glint",
        "  - IF YES: Pass to harmonization engine",
        "Ensures 100% terrestrial fire monitoring"
    ], color=C_RED, border_color='#FCA5A5')

    draw_conn(11.9, y_top + 1.2, 12.4, y_top + 1.2, color=C_RED, label="Land Only")

    # STEP 4: EPSG:6933 Equal-Area Projection
    draw_step(12.5, y_top, card_w, card_h, "4", "1km Equal-Area Projection", [
        "Cylindrical Equal-Area math (R=6371007m)",
        "Transforms (lat, lon) to ground (X, Y)",
        "col = floor(X/1000), row = floor(Y/1000)",
        "Assigns permanent ID: cell_1km_col_row",
        "Every cell occupies exact 1 km² on Earth"
    ], color=C_EMERALD, border_color='#86EFAC')

    # Downward turn arrow from Step 4 to Step 5
    ax.annotate('', xy=(14.1, 3.8), xytext=(14.1, 4.7),
                arrowprops=dict(arrowstyle="->,head_width=0.3,head_length=0.4", 
                                color=C_EMERALD, lw=2.0, zorder=5))
    ax.text(14.2, 4.25, "Standard Grids", fontsize=7.5, fontweight='bold', color=C_EMERALD, va='center', zorder=6)

    # -------------------------------------------------------------
    # BOTTOM ROW: STEPS 5 TO 7 (Right to Left)
    # -------------------------------------------------------------
    y_bot = 1.3

    # STEP 5: Daily UTC Harmonization (Under Step 4)
    draw_step(12.5, y_bot, card_w, card_h, "5", "Daily UTC Binning", [
        "Groups detections by (cell_id, UTC_day)",
        "Merges multiple dots into 1 active cell",
        "Completely eliminates double-counting",
        "Checks dual-sensor presence (MODIS+VIIRS)",
        "Computes mean & peak thermal FRP (MW)"
    ], color=C_EMERALD, border_color='#86EFAC')

    draw_conn(12.4, y_bot + 1.2, 11.9, y_bot + 1.2, color=C_SKY, label="Aggregated")

    # STEP 6: Multi-Year Anomaly Baselines (Middle Bottom)
    draw_step(8.6, y_bot, card_w, card_h, "6", "Seasonal Anomaly Engine", [
        "Saves cell activities into SQLite/PostgreSQL",
        "Computes 5-year historical monthly medians",
        "Calculates Median Absolute Deviation (MAD)",
        "Flags uncharacteristic fire spikes",
        "Generates Burning Calendar monthly matrix"
    ], color=C_PURPLE, border_color='#D8B4FE')

    draw_conn(8.5, y_bot + 1.2, 8.0, y_bot + 1.2, color=C_PURPLE, label="Analytics")

    # STEP 7: Interactive Delivery & Export (Left Bottom)
    draw_step(0.8, y_bot, 7.1, card_h, "7", "Interactive User Presentation & Data Export", [
        "Interactive Leaflet Map: Displays 1km equal-area grids, sensor layers & satellite basemaps",
        "Instant Hover Tooltips: Hovering over any fire or grid reveals sensor, satellite, coordinates & FRP",
        "Burning Activity Calendar: Visualizes multi-year heatmap matrix with historical baseline deviations",
        "Universal Data Portability: One-click export of harmonized datasets in CSV and GeoJSON formats"
    ], color=C_SKY, border_color='#93C5FD')

    # Footer
    ax.text(8.0, 0.45, "FirePulse Workflow  •  Team Virtual Warriors  •  NASA Space Apps Challenge 2026", 
            fontsize=9.5, fontweight='bold', color=C_SLATE_400, ha='center', family='sans-serif')

    out_file = "FirePulse_Workflow_Diagram.png"
    plt.tight_layout()
    plt.savefig(out_file, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Workflow diagram successfully created at: {os.path.abspath(out_file)}")

if __name__ == "__main__":
    create_workflow_diagram()
