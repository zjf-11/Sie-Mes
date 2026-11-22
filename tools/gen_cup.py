# -*- coding: utf-8 -*-
"""Generate the four IIDP SDK app modules for the thermos-cup MES."""
import json
import os
import re

ROOT = r"D:\school\中级软件设计实训\iidp-demo-3.0 2\iidp-demo-3.0\iidp-backend-demo\sie-iidp-demo-apps"

IMPORTS = """package {pkg}.model;

import com.sie.snest.engine.data.RecordSet;
import com.sie.snest.engine.exception.ValidationException;
import com.sie.snest.engine.model.Bool;
import com.sie.snest.engine.rule.Filter;
import com.sie.snest.sdk.BaseModel;
import com.sie.snest.sdk.DataType;
import com.sie.snest.sdk.annotation.meta.MethodService;
import com.sie.snest.sdk.annotation.meta.Model;
import com.sie.snest.sdk.annotation.meta.Property;
import com.sie.snest.sdk.annotation.orm.JoinColumn;
import com.sie.snest.sdk.annotation.orm.ManyToOne;
import com.sie.snest.sdk.annotation.orm.OneToMany;
import com.sie.snest.sdk.annotation.orm.Option;
import com.sie.snest.sdk.annotation.orm.Selection;
import com.sie.snest.sdk.annotation.validate.Validate;
import com.sie.snest.sdk.db.DbUtils;
{extra_imports}
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;
"""

TYPE_OF = {
    "str": "String", "text": "String", "json": "String", "sel": "String",
    "int": "Integer", "dec": "Double", "date": "Date", "bool": "Boolean",
}

GETTER = {
    "str": 'return getStr("{n}");',
    "text": 'return getStr("{n}");',
    "json": 'return getStr("{n}");',
    "sel": 'return getStr("{n}");',
    "int": 'return getInt("{n}");',
    "dec": 'return getDouble("{n}");',
}


def camel_to_snake(name):
    s = re.sub(r"([A-Z])", r"_\1", name).lower()
    return s


def class_pkg(classes, cls):
    return classes[cls]


def field_java(f, classes):
    """Return (declaration, setter, getter) for a field spec."""
    name, kind, disp, opts = f
    opts = opts or {}
    cap = name[0].upper() + name[1:]
    lines = []

    if kind == "ref":
        target = opts["ref"]
        lines.append('    @ManyToOne(displayName = "%s")' % disp)
        lines.append("    @JoinColumn")
        lines.append("    private %s %s;" % (target, name))
        java_type = target
    else:
        ann = []
        if kind == "text":
            ann.append("dataType = DataType.TEXT")
        if kind == "json":
            ann.append("dataType = DataType.JSON")
        if kind == "date":
            ann.append("dataType = DataType.DATE_TIME")
        ann.append('displayName = "%s"' % disp)
        if opts.get("unique"):
            ann.append("unique = true")
        if opts.get("len"):
            ann.append("length = %d" % opts["len"])
        if opts.get("default") is not None:
            ann.append('defaultValue = "%s"' % opts["default"])
        if kind == "sel":
            ann.append('widget = "select"')
            ann.append("length = 256")
        if opts.get("notblank"):
            lines.append('    @Validate.NotBlank(message = "%s不能为空！")' % disp)
        if opts.get("unique"):
            lines.append('    @Validate.Unique(properties = {"%s"}, message = "%s已存在！")' % (name, disp))
        if opts.get("range"):
            lo, hi = opts["range"]
            lines.append('    @Validate.Range(min = %s, max = %s, message = "数量必须大于 0！")' % (lo, hi))
        lines.append("    @Property(%s)" % ", ".join(ann))
        java_type = TYPE_OF[kind]
        if kind == "sel":
            opts_list = ",\n".join(
                '            @Option(label = "%s", value = "%s")' % (lbl, val)
                for lbl, val in opts["options"]
            )
            lines.append("    @Selection(values = {")
            lines.append(opts_list)
            lines.append("    })")
        lines.append("    private %s %s;" % (java_type, name))

    # setter
    setter = [
        "    public %s set%s(%s %s) {" % (opts.get("_cls", ""), cap, java_type, name),
        '        this.set("%s", %s);' % (name, name),
        "        return this;",
        "    }",
    ]
    # getter
    if kind in GETTER:
        getter = ["    public %s get%s() {" % (java_type, cap), "        " + GETTER[kind].format(n=name), "    }"]
    else:
        getter = ["    public %s get%s() {" % (java_type, cap), '        return (%s) this.get("%s");' % (java_type, name), "    }"]

    return "\n".join(lines), "\n".join(setter), "\n".join(getter), java_type


def gen_model(app, m, classes):
    cls = m["cls"]
    pkg = app["pkg"]
    extra = set()
    for f in m["fields"]:
        if f[1] == "ref":
            tgt = f[3]["ref"]
            tpkg = classes[tgt]
            if tpkg != pkg:
                extra.add("import %s.model.%s;" % (tpkg, tgt))
            if f[3].get("many"):
                extra.add("")
    body_fields, setters, getters = [], [], []
    for f in m["fields"]:
        f = list(f)
        opts = dict(f[3] or {})
        opts["_cls"] = cls
        f[3] = opts
        decl, setter, getter, _ = field_java(tuple(f), classes)
        body_fields.append(decl)
        setters.append(setter)
        getters.append(getter)

    # OneToMany collections
    for c in m.get("collections", []):
        cname, cdisp, tmodel, tprop, tcls = c
        body_fields.append(
            '    @OneToMany(targetModel = "%s", targetProperty = "%s", displayName = "%s")\n'
            "    @Property(displayName = \"%s\")\n"
            "    private List<%s> %s;" % (tmodel, tprop, cdisp, cdisp, tcls, cname)
        )
        setters.append(
            "    public %s set%s(List<%s> %s) {\n"
            '        this.set("%s", %s);\n'
            "        return this;\n"
            "    }" % (cls, cname[0].upper() + cname[1:], tcls, cname, cname, cname)
        )
        getters.append(
            "    @SuppressWarnings(\"unchecked\")\n"
            "    public List<%s> get%s() {\n"
            '        return (List<%s>) this.get("%s");\n'
            "    }" % (tcls, cname[0].upper() + cname[1:], tcls, cname)
        )

    services = m.get("services", "")

    src = IMPORTS.format(pkg=pkg, extra_imports="\n".join(sorted(x for x in extra if x)))
    src += """
/**
 * {disp}
 */
@Model(name = "{name}", displayName = "{disp}", description = "{desc}", isAutoLog = Bool.True)
public class {cls} extends BaseModel<{cls}> {{

{fields}

{setters}

{getters}
{services}
}}
""".format(
        disp=m["disp"], name=m["model"], desc=m.get("desc", m["disp"]), cls=cls,
        fields="\n\n".join(body_fields),
        setters="\n\n".join(setters),
        getters="\n\n".join(getters),
        services=("\n" + services + "\n") if services else "",
    )
    return src


def gen_views(app, m):
    """Grid / form / search views for one model."""
    model = m["model"]
    cols = m["cols"]  # list of (displayName, name, extra-dict)
    title = m["disp"]

    def col_list(entries):
        out = []
        for disp, name, extra in entries:
            c = {"displayName": disp, "name": name}
            c.update(extra or {})
            out.append(c)
        return out

    grid = {
        "views": {
            "%s_grid" % model: {
                "body": {
                    "buttons": [
                        {"action": "preview", "auth": "read", "name": "详情"},
                        {"action": "edit", "auth": "update", "name": "编辑"},
                    ],
                    "columns": col_list(m.get("grid_cols", cols)),
                    "tbar": [
                        {"action": "create", "auth": "create", "name": "新增"},
                        {"action": "delete", "auth": "delete", "name": "删除"},
                    ],
                    "type": "grid",
                },
                "mode": "primary",
                "model": model,
                "name": "%s-表格" % title,
                "type": "grid",
            },
            "%s_form" % model: {
                "body": {
                    "columns": col_list(m.get("form_cols", cols)),
                    "tabs": m.get("tabs", []),
                    "type": "form",
                },
                "mode": "primary",
                "model": model,
                "name": "%s-表单" % title,
                "type": "form",
            },
            "%s_search" % model: {
                "body": {
                    "columns": col_list(m.get("search_cols", cols[:3])),
                    "type": "search",
                },
                "mode": "primary",
                "model": model,
                "name": "%s-搜索" % title,
                "type": "search",
            },
        }
    }
    return "%s-view.json" % model.replace("_", "-"), grid


APP_JSON = """{
  "name": "{name}",
  "displayName": "{display}",
  "author": "zjf",
  "company": "sie",
  "category": "MES",
  "product": "保温杯生产管理系统",
  "description": "{desc}",
  "summary": "{display}",
  "type": "SDK",
  "tag": "master",
  "version": "0.0.1",
  "resolved": "{pkg}",
  "dependencies": [{deps}],
  "application": true,
  "icon": null,
  "license": "LGPL 3.0",
  "view": [
{views}
  ],
  "data": []
}
"""

POM = """<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.sie.iidp</groupId>
        <artifactId>sie-iidp-demo-apps</artifactId>
        <version>${{revision}}</version>
    </parent>

    <groupId>com.sie.iidp</groupId>
    <artifactId>{artifact}</artifactId>
    <description>{desc}</description>

    <properties>
        <maven.compiler.source>8</maven.compiler.source>
        <maven.compiler.target>8</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
{deps}
    <build>
        <resources>
            <resource>
                <directory>src/main/resources</directory>
                <filtering>true</filtering>
            </resource>
            <resource>
                <directory>src/main/java</directory>
                <includes>
                    <include>**/*.*</include>
                </includes>
                <excludes>
                    <exclude>**/*.java</exclude>
                </excludes>
            </resource>
        </resources>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-resources-plugin</artifactId>
                <version>3.3.1</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <version>3.4.1</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.2.5</version>
            </plugin>
            <!-- 平台打包插件：把 repackage 产物作为 exec 分类器附件输出，
                 主构件保持普通 jar，供其它 APP 模块编译期引用 -->
            <plugin>
                <groupId>com.sie.meta</groupId>
                <artifactId>sie-snest-maven-plugin</artifactId>
                <configuration>
                    <classifier>exec</classifier>
                    <attach>true</attach>
                </configuration>
            </plugin>
        </plugins>
    </build>

</project>
"""

DEPS_BLOCK = """    <dependencies>
{deps}
    </dependencies>
"""

DEPS_ITEM = """        <dependency>
            <groupId>com.sie.iidp</groupId>
            <artifactId>{artifact}</artifactId>
            <version>${{revision}}</version>
        </dependency>"""


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)


def gen_app(app, classes):
    app["_menus"] = []
    base = os.path.join(ROOT, app["artifact"])
    src_dir = os.path.join(base, "src", "main", "java", *app["pkg"].split("."))
    views_dir = os.path.join(src_dir, "views")

    for rel, content in app.get("extra_files", []):
        write(os.path.join(src_dir, *rel.split("/")), content)

    deps_xml = ""
    if app.get("deps"):
        items = []
        for d in app["deps"]:
            items.append(DEPS_ITEM.format(artifact=d))
        deps_xml = DEPS_BLOCK.format(deps="\n".join(items))
    write(os.path.join(base, "pom.xml"), POM.format(
        artifact=app["artifact"], desc=app["desc"], deps=deps_xml))

    view_files = []
    for m in app["models"]:
        write(os.path.join(src_dir, "model", "%s.java" % m["cls"]), gen_model(app, m, classes))
        for fname, content in [gen_views(app, m)]:
            write(os.path.join(views_dir, fname), json.dumps(content, ensure_ascii=False, indent=2))
            view_files.append(fname)
            if m.get("menu", True):
                app.setdefault("_menus", []).append((m["model"], m["disp"], fname.replace("-view.json", "")))

    app_json = {
        "name": app["name"],
        "displayName": app["display"],
        "author": "zjf",
        "company": "sie",
        "category": "MES",
        "product": "保温杯生产管理系统",
        "description": app["desc"],
        "summary": app["display"],
        "type": "SDK",
        "tag": "master",
        "version": "0.0.1",
        "resolved": app["pkg"],
        "dependencies": app.get("app_deps", []),
        "application": True,
        "icon": None,
        "license": "LGPL 3.0",
        "view": view_files,
        "data": [],
    }
    write(os.path.join(src_dir, "app.json"), json.dumps(app_json, ensure_ascii=False, indent=2))

    menus = {
        app["name"] + "_root_menu": {
            "name": app["name"] + "_root_menu",
            "display_name": app["display"],
            "active": True,
            "sequence": app["seq"],
        }
    }
    for idx, (model, disp, viewbase) in enumerate(app.get("_menus", []), start=1):
        menus["%s_menu" % model] = {
            "name": "%s_menu" % model,
            "display_name": disp,
            "model": model,
            "view": "%s_grid,%s_search,%s_form" % (viewbase.replace("-view", ""), viewbase.replace("-view", ""), viewbase.replace("-view", "")),
            "sequence": idx,
            "active": True,
            "parent_ids": {"@ref": app["name"] + "_root_menu"},
        }
    # view base names are model_grid/model_form from gen_views -> recompute
    for key, item in list(menus.items()):
        if key.endswith("_menu") and key != app["name"] + "_root_menu":
            model = item["model"]
            item["view"] = "%s_grid,%s_search,%s_form" % (model, model, model)
    write(os.path.join(views_dir, "menus.json"), json.dumps({"menus": menus}, ensure_ascii=False, indent=2))


CLASSES = {}


def build_all(apps):
    for app in apps:
        for m in app["models"]:
            CLASSES[m["cls"]] = app["pkg"]
    for app in apps:
        gen_app(app, CLASSES)


if __name__ == "__main__":
    import cup_spec
    build_all(cup_spec.APPS)
    print("generated")
