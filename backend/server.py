#!/usr/bin/env python3
import os
import sys
import json
import base64
import mimetypes
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
import urllib.parse

BACKEND_DIR = Path(__file__).parent.resolve()
STUDIO_ROOT = BACKEND_DIR.parent.resolve()
FRONTEND_DIR = (STUDIO_ROOT / "frontend").resolve()

def resolve_mods_dir():
    if "MINE_MODS_DIR" in os.environ:
        p = Path(os.environ["MINE_MODS_DIR"]).resolve()
        if p.exists():
            return p
    for candidate in [
        STUDIO_ROOT.parent / "mine-mods",
        STUDIO_ROOT / "mine-mods",
        Path("/home/alex/side/mine-mods"),
        Path.cwd() / "mine-mods",
    ]:
        if candidate.is_dir():
            return candidate.resolve()
    return (STUDIO_ROOT.parent / "mine-mods").resolve()

MINE_MODS_DIR = resolve_mods_dir()
WORKSPACE_ROOT = MINE_MODS_DIR.parent

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

class ModStudioHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_DIR), **kwargs)

    def _send_json(self, data, status=200):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, message, status=400):
        self._send_json({"error": message, "success": False}, status=status)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path.startswith("/api/"):
            try:
                self.handle_api_get(path, query)
            except Exception as e:
                self._send_error(str(e), status=500)
            return

        # Serve static frontend files
        if path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/"):
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                post_body = self.rfile.read(content_len).decode("utf-8")
                payload = json.loads(post_body) if post_body else {}
                self.handle_api_post(path, payload)
            except Exception as e:
                self._send_error(str(e), status=500)
            return

        self._send_error("Not found", 404)

    def get_mod_dir(self, mod_id):
        if not mod_id:
            raise ValueError("mod_id is required")
        mod_dir = (MINE_MODS_DIR / mod_id).resolve()
        if not mod_dir.is_dir() or not mod_dir.is_relative_to(MINE_MODS_DIR):
            raise ValueError(f"Mod directory not found or invalid: {mod_id}")
        return mod_dir

    def get_entity_3d_model(self, mod_dir, model_name):
        import re
        java_files = list((mod_dir / "src" / "main" / "java").glob(f"**/*{model_name.capitalize()}Models.java"))
        if not java_files:
            java_files = list((mod_dir / "src" / "main" / "java").glob(f"**/*Models.java"))
            java_files = [f for f in java_files if model_name in f.name.lower()]

        if not java_files:
            return {"name": model_name, "layers": {"body": [], "trim": []}, "type": "unknown"}

        target_java = java_files[0]
        with open(target_java, "r", encoding="utf-8") as f:
            code = f.read()

        # Strip comments so semicolons or parentheses inside comments never interfere
        code = re.sub(r"//.*", "", code)
        code = re.sub(r"/\*.*?\*/", "", code, flags=re.DOTALL)

        constants = {"FORK_RAKE": -0.42}
        for m in re.finditer(r"private static final float ([A-Za-z0-9_]+)\s*=\s*([-0-9.]+F?);", code):
            constants[m.group(1)] = float(m.group(2).rstrip("Ff"))
        for m in re.finditer(r'private static final String ([A-Za-z0-9_]+)\s*=\s*"([^"]+)";', code):
            constants[m.group(1)] = m.group(2)

        def eval_num(s):
            s = s.strip().rstrip("Ff")
            s = s.replace("(float)", "").replace("Math.PI", "3.14159265")
            for k, v in constants.items():
                if isinstance(v, float):
                    s = re.sub(r"\b" + k + r"\b", str(v), s)
            try:
                return round(float(eval(s, {"__builtins__": None})), 4)
            except Exception:
                return 0.0

        tex_w, tex_h = 256, 256
        lm = re.search(r"LayerDefinition\.create\(mesh,\s*(\d+),\s*(\d+)\)", code)
        if lm:
            tex_w, tex_h = int(lm.group(1)), int(lm.group(2))

        layers = {}
        for layer_name in ["Body", "Trim"]:
            sm = re.search(r"create" + layer_name + r"Layer\(\)\s*\{(.*?)return LayerDefinition", code, re.DOTALL)
            if not sm:
                continue
            body = sm.group(1)

            statements = [s.strip() for s in body.split(";") if s.strip()]
            var_cubes = {}
            var_uv = {}
            var_to_id = {"root": "root"}
            parts = []

            for stmt in statements:
                vm = re.match(r"CubeListBuilder\s+([A-Za-z0-9_]+)\s*=\s*(.+)", stmt, re.DOTALL)
                if vm:
                    vname, expr = vm.group(1), vm.group(2)
                    c_list = []
                    cur_u, cur_v = 0, 0
                    for chunk in re.split(r"(?=(?:texOffs|cube)\s*\()", expr):
                        tm = re.search(r"(?:texOffs|cube)\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)", chunk)
                        if tm:
                            cur_u, cur_v = int(tm.group(1)), int(tm.group(2))
                        for bm in re.finditer(r"\.addBox\s*\(\s*([^)]+)\s*\)", chunk):
                            args = [eval_num(x) for x in bm.group(1).split(",")]
                            if len(args) == 6:
                                c_list.append({"u": cur_u, "v": cur_v, "box": args})
                    var_cubes[vname] = c_list
                    var_uv[vname] = (cur_u, cur_v)
                    continue

                pm = re.search(
                    r'(?:PartDefinition\s+([A-Za-z0-9_]+)\s*=\s*)?([A-Za-z0-9_]+)\.addOrReplaceChild\s*\(\s*([^,]+)\s*,\s*(.+)\s*,\s*(PartPose\.[A-Za-z0-9_]+(?:\(.+\))?|at\(.+\))\s*\)',
                    stmt,
                    re.DOTALL,
                )
                if pm:
                    var_decl = pm.group(1)
                    parent_var = pm.group(2)
                    raw_name = pm.group(3).strip().strip('"')
                    builder = pm.group(4).strip()
                    pose = pm.group(5).strip()

                    if "WHEELS[" in raw_name or parent_var == "wheel":
                        continue

                    part_id = constants.get(raw_name, raw_name)
                    parent_id = var_to_id.get(parent_var, parent_var)

                    px, py, pz, rx, ry, rz = 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
                    if "offsetAndRotation" in pose:
                        inner = re.search(r"offsetAndRotation\((.+)\)", pose, re.DOTALL).group(1)
                        args = [eval_num(x) for x in inner.split(",")]
                        if len(args) >= 6:
                            px, py, pz, rx, ry, rz = args[:6]
                    elif "at(" in pose or "offset(" in pose:
                        inner = re.search(r"(?:at|offset)\((.+)\)", pose, re.DOTALL).group(1)
                        args = [eval_num(x) for x in inner.split(",")]
                        if len(args) >= 3:
                            px, py, pz = args[:3]
                    elif "rotation(" in pose:
                        inner = re.search(r"rotation\((.+)\)", pose, re.DOTALL).group(1)
                        args = [eval_num(x) for x in inner.split(",")]
                        if len(args) >= 3:
                            rx, ry, rz = args[:3]

                    c_list = []
                    if builder in var_cubes:
                        c_list = [dict(c) for c in var_cubes[builder]]
                    else:
                        cur_u, cur_v = 0, 0
                        m_var = re.match(r"^([A-Za-z0-9_]+)\.", builder)
                        if m_var and m_var.group(1) in var_uv:
                            cur_u, cur_v = var_uv[m_var.group(1)]
                        for chunk in re.split(r"(?=(?:texOffs|cube)\s*\()", builder):
                            tm = re.search(r"(?:texOffs|cube)\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)", chunk)
                            if tm:
                                cur_u, cur_v = int(tm.group(1)), int(tm.group(2))
                            for bm in re.finditer(r"\.addBox\s*\(\s*([^)]+)\s*\)", chunk):
                                args = [eval_num(x) for x in bm.group(1).split(",")]
                                if len(args) == 6:
                                    c_list.append({"u": cur_u, "v": cur_v, "box": args})

                    unique_id = f"{parent_id}_{part_id}" if part_id in ["tread_45", "hubs"] else part_id
                    if var_decl:
                        var_to_id[var_decl] = unique_id

                    parts.append({
                        "id": unique_id,
                        "name": unique_id,
                        "parent": parent_id,
                        "pos": [px, py, pz],
                        "rot": [rx, ry, rz],
                        "cubes": c_list,
                    })

            if "WHEELS.length" in body:
                if model_name == "car":
                    w_positions = [[14, 18, -14], [-14, 18, -14], [14, 18, 14], [-14, 18, 14]]
                    w_names = ["wheel_fl", "wheel_fr", "wheel_bl", "wheel_br"]
                else:
                    w_positions = [[0, 19, -15], [10.5, 19, 12], [-10.5, 19, 12]]
                    w_names = ["wheel_front", "wheel_bl", "wheel_br"]
                t0 = var_cubes.get("tread0", [])
                t45 = var_cubes.get("tread45", [])
                hubs = var_cubes.get("hubs", [])
                for idx, wname in enumerate(w_names):
                    parts.append({
                        "id": wname,
                        "name": wname,
                        "parent": "root",
                        "pos": w_positions[idx],
                        "rot": [0, 0, 0],
                        "cubes": t0,
                    })
                    parts.append({
                        "id": wname + "_45",
                        "name": wname + "_45",
                        "parent": wname,
                        "pos": [0, 0, 0],
                        "rot": [0.7854, 0, 0],
                        "cubes": t45,
                    })
                    parts.append({
                        "id": wname + "_hubs",
                        "name": wname + "_hubs",
                        "parent": wname,
                        "pos": [0, 0, 0],
                        "rot": [0, 0, 0],
                        "cubes": hubs,
                    })

            layers[layer_name.lower()] = parts

        return {
            "name": model_name,
            "textureWidth": tex_w,
            "textureHeight": tex_h,
            "defaultTint": "#1846C7" if model_name == "motorcycle" else ("#D32F2F" if model_name == "car" else "#FFFFFF"),
            "layers": layers,
        }

    def get_resources_dir(self, mod_id):
        mod_dir = self.get_mod_dir(mod_id)
        res_dir = mod_dir / "src" / "main" / "resources"
        if not res_dir.exists():
            res_dir.mkdir(parents=True, exist_ok=True)
        return res_dir

    def handle_api_get(self, path, query):
        if path == "/api/mods":
            mods = []
            if MINE_MODS_DIR.exists():
                for item in sorted(MINE_MODS_DIR.iterdir()):
                    if item.is_dir() and not item.name.startswith("."):
                        has_gradle = (item / "build.gradle").exists() or (item / "build.gradle.kts").exists()
                        res_dir = item / "src" / "main" / "resources"
                        mods.append({
                            "id": item.name,
                            "name": item.name.replace("-", " ").title(),
                            "hasResources": res_dir.exists(),
                            "hasGradle": has_gradle,
                            "path": str(item)
                        })
            self._send_json({"mods": mods, "success": True})
            return

        mod_id = query.get("mod", [None])[0]
        if not mod_id:
            self._send_error("Missing 'mod' query parameter")
            return

        res_dir = self.get_resources_dir(mod_id)

        if path == "/api/model-3d":
            model_name = query.get("name", ["motorcycle"])[0].lower()
            # Clean model name (remove .png, entity/, etc.)
            model_name = model_name.split("/")[-1].replace(".png", "").replace("_trim", "")
            mod_dir = self.get_mod_dir(mod_id)
            model_data = self.get_entity_3d_model(mod_dir, model_name)
            self._send_json({"model": model_data, "success": True})
            return

        if path == "/api/tree":
            tree = self.build_tree(res_dir, res_dir)
            self._send_json({"tree": tree, "mod": mod_id, "success": True})
            return

        if path in ["/api/file", "/api/raw-image"]:
            rel_path = query.get("path", [None])[0]
            raw = path == "/api/raw-image" or query.get("raw", ["0"])[0] in ["1", "true"]
            if not rel_path:
                self._send_error("Missing 'path' query parameter")
                return
            target_file = (res_dir / rel_path).resolve()
            if not target_file.is_file() or not target_file.is_relative_to(res_dir):
                self._send_error("File not found or outside resources dir", 404)
                return

            ext = target_file.suffix.lower()
            if ext in [".png", ".jpg", ".jpeg", ".webp"]:
                mime = mimetypes.guess_type(target_file)[0] or "image/png"
                if raw:
                    with open(target_file, "rb") as f:
                        raw_bytes = f.read()
                    self.send_response(200)
                    self.send_header("Content-Type", mime)
                    self.send_header("Content-Length", str(len(raw_bytes)))
                    self.send_header("Cache-Control", "no-cache, must-revalidate")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(raw_bytes)
                    return

                with open(target_file, "rb") as f:
                    b64 = base64.b64encode(f.read()).decode("ascii")
                self._send_json({
                    "path": rel_path,
                    "type": "image",
                    "mime": mime,
                    "data": f"data:{mime};base64,{b64}",
                    "name": target_file.name,
                    "size": target_file.stat().st_size,
                    "success": True
                })
            else:
                with open(target_file, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
                self._send_json({
                    "path": rel_path,
                    "type": "text",
                    "content": content,
                    "name": target_file.name,
                    "size": target_file.stat().st_size,
                    "success": True
                })
            return

        if path == "/api/langs":
            # Discover lang files in assets/*/lang/*.json
            assets_dir = res_dir / "assets"
            langs_data = {}
            all_keys = set()
            lang_files = {}

            if assets_dir.exists():
                for lang_file in assets_dir.glob("*/lang/*.json"):
                    lang_code = lang_file.stem
                    rel_p = str(lang_file.relative_to(res_dir))
                    try:
                        with open(lang_file, "r", encoding="utf-8") as f:
                            content = json.load(f)
                            if isinstance(content, dict):
                                langs_data[lang_code] = content
                                lang_files[lang_code] = rel_p
                                for k in content.keys():
                                    all_keys.add(k)
                    except Exception as err:
                        langs_data[lang_code] = {"_error": str(err)}

            sorted_keys = sorted(list(all_keys))
            self._send_json({
                "mod": mod_id,
                "languages": sorted(list(langs_data.keys())),
                "keys": sorted_keys,
                "data": langs_data,
                "files": lang_files,
                "success": True
            })
            return

        if path == "/api/recipes":
            data_dir = res_dir / "data"
            recipes = []
            if data_dir.exists():
                for rec_file in data_dir.glob("*/recipe/*.json"):
                    rel_p = str(rec_file.relative_to(res_dir))
                    try:
                        with open(rec_file, "r", encoding="utf-8") as f:
                            rec_json = json.load(f)
                            recipes.append({
                                "id": rec_file.stem,
                                "name": rec_file.stem.replace("_", " ").title(),
                                "path": rel_p,
                                "data": rec_json
                            })
                    except Exception as err:
                        recipes.append({
                            "id": rec_file.stem,
                            "name": rec_file.stem,
                            "path": rel_p,
                            "error": str(err)
                        })
            self._send_json({"recipes": recipes, "mod": mod_id, "success": True})
            return

        if path == "/api/textures-list":
            textures = []
            assets_dir = res_dir / "assets"
            if assets_dir.exists():
                import struct
                for tex_file in assets_dir.glob("**/*.png"):
                    rel_p = str(tex_file.relative_to(res_dir)).replace("\\", "/")
                    namespace = tex_file.parts[tex_file.parts.index("assets") + 1]
                    sub_path = str(tex_file.relative_to(assets_dir / namespace / "textures")).replace("\\", "/") if "textures" in tex_file.parts else str(tex_file.name)
                    # remove .png
                    if sub_path.endswith(".png"):
                        sub_path_id = sub_path[:-4]
                    else:
                        sub_path_id = sub_path
                    item_id = f"{namespace}:{sub_path_id}"

                    # Detect category
                    cat = "other"
                    if "entity" in tex_file.parts:
                        cat = "entity"
                    elif "item" in tex_file.parts:
                        cat = "item"
                    elif "block" in tex_file.parts:
                        cat = "block"
                    elif tex_file.name == "icon.png":
                        cat = "icon"

                    # Fast PNG dimensions read from IHDR header
                    dims = [16, 16]
                    try:
                        with open(tex_file, "rb") as pf:
                            hdr = pf.read(24)
                            if hdr.startswith(b"\x89PNG\r\n\x1a\n") and hdr[12:16] == b"IHDR":
                                dims = list(struct.unpack(">II", hdr[16:24]))
                    except Exception:
                        pass

                    textures.append({
                        "id": item_id,
                        "path": rel_p,
                        "name": tex_file.stem,
                        "filename": tex_file.name,
                        "subpath": sub_path,
                        "category": cat,
                        "dimensions": dims,
                        "size": tex_file.stat().st_size
                    })
            self._send_json({"textures": textures, "success": True})
            return

        self._send_error("Endpoint not found", 404)

    def handle_api_post(self, path, payload):
        mod_id = payload.get("mod")
        if not mod_id:
            self._send_error("Missing 'mod' in payload")
            return
        res_dir = self.get_resources_dir(mod_id)

        if path == "/api/save":
            rel_path = payload.get("path")
            file_type = payload.get("type", "text")
            content = payload.get("content")

            if not rel_path or content is None:
                self._send_error("Missing 'path' or 'content'")
                return

            target_file = (res_dir / rel_path).resolve()
            if not target_file.is_relative_to(res_dir):
                self._send_error("Path traversal forbidden", 403)
                return

            target_file.parent.mkdir(parents=True, exist_ok=True)

            if file_type == "image":
                # Expecting base64 string (either with or without data:image/png;base64, prefix)
                if "," in content:
                    content = content.split(",", 1)[1]
                img_bytes = base64.b64decode(content)
                with open(target_file, "wb") as f:
                    f.write(img_bytes)
            else:
                with open(target_file, "w", encoding="utf-8") as f:
                    f.write(content)

            self._send_json({"success": True, "message": f"Saved {rel_path}", "path": rel_path})
            return

        if path == "/api/save-langs":
            # Saves updated lang data: { mod, langData: { "en_us": { ... }, "es_es": { ... } } }
            lang_data = payload.get("langData", {})
            files_map = payload.get("files", {})
            assets_dir = res_dir / "assets"

            saved = []
            for lang_code, translations in lang_data.items():
                if lang_code in files_map:
                    target_file = (res_dir / files_map[lang_code]).resolve()
                else:
                    # Default to assets/<mod>/lang/<lang_code>.json
                    target_file = (assets_dir / mod_id / "lang" / f"{lang_code}.json").resolve()

                if not target_file.is_relative_to(res_dir):
                    continue

                target_file.parent.mkdir(parents=True, exist_ok=True)
                with open(target_file, "w", encoding="utf-8") as f:
                    json.dump(translations, f, indent="\t", ensure_ascii=False)
                    f.write("\n")
                saved.append(lang_code)

            self._send_json({"success": True, "savedLanguages": saved})
            return

        if path == "/api/create-file":
            rel_path = payload.get("path")
            is_dir = payload.get("isDir", False)
            content = payload.get("content", "")

            if not rel_path:
                self._send_error("Missing 'path'")
                return

            target = (res_dir / rel_path).resolve()
            if not target.is_relative_to(res_dir):
                self._send_error("Path traversal forbidden", 403)
                return

            if is_dir:
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                if not target.exists():
                    with open(target, "w", encoding="utf-8") as f:
                        f.write(content)

            self._send_json({"success": True, "path": rel_path})
            return

        if path == "/api/delete-file":
            rel_path = payload.get("path")
            if not rel_path:
                self._send_error("Missing 'path'")
                return
            target = (res_dir / rel_path).resolve()
            if not target.is_relative_to(res_dir) or target == res_dir:
                self._send_error("Invalid deletion path", 403)
                return

            if target.is_file():
                target.unlink()
            elif target.is_dir():
                import shutil
                shutil.rmtree(target)

            self._send_json({"success": True, "deleted": rel_path})
            return

        self._send_error("Endpoint not found", 404)

    def build_tree(self, root_dir, current_dir):
        items = []
        if not current_dir.exists():
            return items

        for entry in sorted(current_dir.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
            if entry.name.startswith("."):
                continue
            rel_path = str(entry.relative_to(root_dir))
            is_dir = entry.is_dir()
            ext = entry.suffix.lower() if not is_dir else ""

            # Categorize type
            item_type = "folder" if is_dir else "file"
            if ext == ".png":
                item_type = "texture"
            elif ext == ".json":
                if "recipe" in entry.parts:
                    item_type = "recipe"
                elif "lang" in entry.parts:
                    item_type = "lang"
                elif "models" in entry.parts or "items" in entry.parts:
                    item_type = "model"
                else:
                    item_type = "json"

            node = {
                "name": entry.name,
                "path": rel_path,
                "isDir": is_dir,
                "type": item_type,
                "size": entry.stat().st_size if not is_dir else None
            }
            if is_dir:
                node["children"] = self.build_tree(root_dir, entry)
            items.append(node)
        return items

def run_server(port=8000):
    for p in [port, 8080, 8081, 8888, 5000, 3000]:
        try:
            server_address = ("0.0.0.0", p)
            httpd = ThreadedHTTPServer(server_address, ModStudioHandler)
            print(f"=====================================================")
            print(f"  🎨 ModCraft Studio running at: http://localhost:{p}")
            print(f"  📁 Mods directory: {MINE_MODS_DIR}")
            print(f"  💻 Frontend directory: {FRONTEND_DIR}")
            print(f"=====================================================")
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nShutting down ModCraft Studio...")
                httpd.server_close()
            return
        except OSError as e:
            if e.errno == 98:  # Address already in use
                continue
            raise
    print(f"Error: Could not bind to any tested port (8000, 8080, 8081, 8888, 5000, 3000).")

if __name__ == "__main__":
    port = 8000
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    run_server(port)

