import logging
import os
from pathlib import Path
from flask import Flask, jsonify, send_from_directory, render_template_string
from flask_cors import CORS
from .config import Config
from .db import init_db
from .routes import (
    health_bp, data_bp, dashboard_bp, hotspots_bp,
    calendar_bp, comparison_bp, trends_bp, anomalies_bp, export_bp, global_bp
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("firepulse")

def create_app(config_class=Config) -> Flask:
    """Application factory for FirePulse Backend."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for all routes (frontend integration)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize database tables
    with app.app_context():
        init_db()
        logger.info("Database initialized successfully.")

    # Register blueprints under /api prefix
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(data_bp, url_prefix="/api")
    app.register_blueprint(dashboard_bp, url_prefix="/api")
    app.register_blueprint(hotspots_bp, url_prefix="/api")
    app.register_blueprint(calendar_bp, url_prefix="/api")
    app.register_blueprint(comparison_bp, url_prefix="/api")
    app.register_blueprint(trends_bp, url_prefix="/api")
    app.register_blueprint(anomalies_bp, url_prefix="/api")
    app.register_blueprint(export_bp, url_prefix="/api")
    app.register_blueprint(global_bp, url_prefix="/api")

    # Serve built frontend or informative interactive portal
    dist_dir = Config.WORKSPACE_DIR / "frontend" / "dist"

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path.startswith("api"):
            return jsonify({"error": "API route not found", "status_code": 404}), 404

        if dist_dir.exists() and (dist_dir / path).exists() and path != "":
            return send_from_directory(dist_dir, path)
        if dist_dir.exists() and (dist_dir / "index.html").exists():
            return send_from_directory(dist_dir, "index.html")

        # Interactive Scientific Portal for direct backend visitors
        portal_html = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>FirePulse — NASA FIRMS Harmonization Backend</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col justify-between p-6">
            <div class="max-w-4xl mx-auto w-full space-y-6 pt-6">
                <div class="flex items-center space-x-3 pb-4 border-b border-slate-800">
                    <div class="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-orange-600/30">🔥</div>
                    <div>
                        <div class="flex items-center space-x-2">
                            <h1 class="text-2xl font-black text-white">FirePulse</h1>
                            <span class="px-2 py-0.5 rounded text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">NASA Space Apps 2026</span>
                        </div>
                        <p class="text-xs text-slate-400">MODIS & VIIRS Hot Spot Geospatial Harmonization Platform | Team: Virtual Warriors</p>
                    </div>
                </div>

                <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <h2 class="text-base font-bold text-white flex items-center space-x-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Backend REST API Online & Operating</span>
                    </h2>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        The FirePulse Python Flask backend is running. Below are live endpoints available for data exploration, NASA FIRMS queries, geospatial harmonization, and CSV exports.
                    </p>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <a href="/api/health" class="p-3 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 transition block">
                            <span class="text-xs font-mono font-bold text-cyan-400">GET /api/health</span>
                            <p class="text-[11px] text-slate-400 mt-0.5">System status & FIRMS key verification</p>
                        </a>
                        <a href="/api/data/sources" class="p-3 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 transition block">
                            <span class="text-xs font-mono font-bold text-cyan-400">GET /api/data/sources</span>
                            <p class="text-[11px] text-slate-400 mt-0.5">MODIS & VIIRS sensor specifications</p>
                        </a>
                        <a href="/api/dashboard/summary" class="p-3 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 transition block">
                            <span class="text-xs font-mono font-bold text-cyan-400">GET /api/dashboard/summary</span>
                            <p class="text-[11px] text-slate-400 mt-0.5">Aggregated KPIs & 14-day timeline</p>
                        </a>
                        <a href="/api/hotspots" class="p-3 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 transition block">
                            <span class="text-xs font-mono font-bold text-cyan-400">GET /api/hotspots</span>
                            <p class="text-[11px] text-slate-400 mt-0.5">Individual hotspot points & 1km cells</p>
                        </a>
                        <a href="/api/calendar" class="p-3 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 transition block">
                            <span class="text-xs font-mono font-bold text-orange-400">GET /api/calendar</span>
                            <p class="text-[11px] text-slate-400 mt-0.5">Harmonized burning activity calendar</p>
                        </a>
                        <a href="/api/comparison" class="p-3 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 transition block">
                            <span class="text-xs font-mono font-bold text-orange-400">GET /api/comparison</span>
                            <p class="text-[11px] text-slate-400 mt-0.5">MODIS vs VIIRS statistical comparison</p>
                        </a>
                        <a href="/api/trends" class="p-3 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 transition block">
                            <span class="text-xs font-mono font-bold text-purple-400">GET /api/trends</span>
                            <p class="text-[11px] text-slate-400 mt-0.5">Historical years & seasonality curve</p>
                        </a>
                        <a href="/api/anomalies" class="p-3 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 transition block">
                            <span class="text-xs font-mono font-bold text-red-400">GET /api/anomalies</span>
                            <p class="text-[11px] text-slate-400 mt-0.5">Statistical anomaly detection (MAD & Robust Z)</p>
                        </a>
                    </div>
                </div>

                <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
                    <h3 class="font-bold text-white uppercase tracking-wider text-[11px]">Frontend Instructions</h3>
                    <p>To run the full React + Vite UI with Leaflet maps and interactive burning calendar heatmaps:</p>
                    <pre class="bg-slate-950 p-3 rounded-lg border border-slate-800 text-orange-300 font-mono text-[11px] overflow-x-auto">cd frontend&#10;npm.cmd run dev</pre>
                    <p>Open <strong class="text-white">http://localhost:3000</strong> in your browser.</p>
                </div>
            </div>

            <footer class="text-center py-6 text-xs text-slate-400 border-t border-slate-900 mt-8">
                Independent student project using NASA FIRMS data. Not an official NASA emergency warning system.
            </footer>
        </body>
        </html>
        """
        return render_template_string(portal_html)

    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Resource not found", "status_code": 404}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error", "status_code": 500}), 500

    return app
