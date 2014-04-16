/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */
var moment = require("moment");
var fs = require("fs");

// Build date shown in the About box
var buildTimestamp = moment.utc().format("MMMM DD, YYYY [-] HH:mm [UTC]");

// Append to all URI references for cache busting
var buildNonce = moment.utc().format("YYYYMMDDHHmmssSSS");

// If being built with Jenkins, include the build number in artifacts
var buildNumber = ( process.env.BUILD_NUMBER )
    ? "." + process.env.BUILD_NUMBER : "";

module.exports = function(grunt) {

    // Lists of JavaScript and CSS files to include and in the correct
    // order
    var wvJs   = grunt.file.readJSON("etc/deploy/wv.js.json");
    var wvCss  = grunt.file.readJSON("etc/deploy/wv.css.json");

    // Copyright notice to place at the top of the minified JavaScript and
    // CSS files
    var banner = grunt.file.read("etc/deploy/banner.txt");

    // Branding and build options
    var opt = {};

    if ( fs.existsSync("options.json") ) {
        opt = grunt.file.readJSON("etc/brand/options.json");

        var bitly = fs.existsSync("conf/bitly_config.py");
        var eosdis = fs.existsSync("conf/web/eosdis");
        var gibsOps = !process.env.GIBS_HOST;
        var official = bitly && eosdis && gibsOps &&
                opt.email === "support@earthdata.nasa.gov";

        console.log();
        console.log("============================================================");
        console.log("[" + opt.packageName + "] " + opt.officialName +
                ", Version " + opt.version + "-" + opt.release);
        console.log("");
        console.log("Long name          : " + opt.officialName);
        console.log("Short name         : " + opt.shortName);
        console.log("GIBS public servers: " + gibsOps);
        console.log("bit.ly support     : " + bitly);
        console.log("EOSDIS options     : " + eosdis);
        console.log("Support email      : " + opt.email);

        if ( !official ) {
            console.error();
            grunt.log.error("WARNING: This is NOT a standard configuration");
        }
        console.log("============================================================");
        console.log();
    }

    grunt.initConfig({
        "git-rev-parse": {
            build: {
                options: {
                    prop: 'git-revision',
                    number: 6
                }
            }
        },

        copy: {
            brand: {
                files: [
                    { expand: true, cwd: "etc/brand",
                      src: ["**"], dest: "." }
                ]
            },

            // Copies the source files to the build directory
            source: {
                files: [
                    { expand: true, cwd: "src",
		              src: ["**", "**/.htaccess"],
                      dest: "build/worldview-debug/web" },
                    { expand: true, cwd: "bin",
		              src: "**", dest: "build/worldview-debug/bin" },
                    { expand: true, cwd: "conf",
                      src: "**", dest: "build/worldview-debug/conf" }
                ]
            },

            // Copies the concatenated JavaScript and CSS files to the
            // final location in the release web root being built.
            concat: {
                files: [
                    { expand: false, src: "build/worldview.js",
                      dest: "build/worldview-debug/web" },
                    { expand: false, src: "build/worldview.css",
                      dest: "build/worldview-debug/web" }
                ]
            },

            // Copies the finished version of the debugging web root to
            // create a release web root. JavaScript and CSS files are omitted
            // since the concatenated version is used instead. Files that
            // must be included in non-concatenated form should be copied
            // over too
            release: {
                files: [
                    { expand: true, cwd: "build/worldview-debug",
		      src: ["**", "**/.htaccess"],
                      dest: "build/worldview" },
                    { expand: true, cwd: "build/worldview-debug/web",
                      src: [
                        "css/pages.css",
                        "css/bulkDownload.css",
                        "js/map/wv.map.tileworker.js"
                      ],
                      dest: "build/worldview/web" }
                ]
            },

            // Copies the built tarballs, auxillary files, and spec file
            // to the build directory
            rpm_sources: {
                files: [
                    { expand: true, cwd: "etc/deploy/sources",
                      src: ["**"], dest: "build/rpmbuild/SOURCES" },
                    { expand: true, cwd: "etc/deploy",
                      src: ["worldview.spec"], dest: "build/rpmbuild/SPECS" },
                    { expand: true, cwd: "dist",
                      src: ["worldview.tar.bz2", "worldview-debug.tar.bz2"],
                      dest: "build/rpmbuild/SOURCES" }
	            ]
            },

            // Copies the built RPMs in the build directory to the dist
            // directory
            rpm: {
                files: [
                    { expand: true, flatten: true, cwd: "build/rpmbuild",
                      src: ["**/*.rpm"], dest: "dist" }
                ]
            }
        },

        exec: {
            config: {
                command: "PATH=python/bin:${PATH} bin/make-conf"
            },

            update_gc: {
                command: "bin/fetch-gibs"
            },

            // After removing JavaScript and CSS files that are no longer
            // need in a release build, there are a lot of empty directories.
            // Remove all of them.
            empty: {
                command: "find build -type d -empty -delete"
            },

            // Enable executable bits for all CGI programs
            cgi_echo: {
                command: "chmod 755 build/worldview*/web/service/echo.cgi"
            },

            cgi_shorten: {
                command: "chmod 755 build/worldview*/web/service/link/shorten.cgi"
            },

            // Create a tarball of the debug build with a version number and
            // git revision.
            tar_debug_versioned: {
                command: "tar cjCf build dist/" +
                            "<%= pkg.name %>" +
                            "-debug" +
                            "-<%= pkg.version %>" +
                            "-<%= pkg.release %>" +
                            buildNumber +
                            ".git<%= grunt.config.get('git-revision') %>" +
                            ".tar.bz2 worldview-debug"
            },

            // Create a tarball of the debug build without versioning
            // information
            tar_debug: {
                command: "tar cjCf build dist/worldview-debug.tar.bz2 " +
                            "worldview-debug"
            },

            // Create a tarball of the release build with a version number and
            // git revision
            tar_release_versioned: {
                command: "tar cjCf build dist/" +
                            "<%= pkg.name %>" +
                            "-<%= pkg.version %>" +
                            "-<%= pkg.release %>" +
                            buildNumber +
                            ".git<%= grunt.config.get('git-revision') %>" +
                            ".tar.bz2 worldview"
            },

            // Create a tarball of the release build without versioning
            // information
            tar_release: {
                command: "tar cjCf build dist/worldview.tar.bz2 " +
                            "worldview"
            },

            // Create a tarball of the documentation with a version number and
            // git revision
            tar_doc_versioned: {
                command: "tar cjCf build dist/" +
                            "<%= pkg.name %>" +
                            "-doc" +
                            "-<%= pkg.version %>" +
                            "-<%= pkg.release %>" +
                            buildNumber +
                            ".git<%= grunt.config.get('git-revision') %>" +
                            ".tar.bz2 worldview-doc"
            },

            // Create a tarball of the documentation without versioning
            // information
            tar_doc: {
                command: "tar cjCf build dist/worldview-doc.tar.bz2 " +
                            "worldview-doc"
            },

            // Builds the RPM
            rpmbuild: {
                command: 'rpmbuild --define "_topdir $PWD/build/rpmbuild" ' +
                            '--define "build_num ' + buildNumber +'" ' +
			    '-ba build/rpmbuild/SPECS/worldview.spec'
            }
        },

        replace: {
            // Official name of the application
            tokens: {
                src: [
                    "build/worldview-debug/web/*.html",
                    "build/worldview-debug/web/js/**/*.js",
                    "build/worldview-debug/web/pages/**/*.html"
                ],
                overwrite: true,
                replacements: [{
                    from: "@OFFICIAL_NAME@",
                    to: options.officialName
                }, {
                    from: "@LONG_NAME@",
                    to: options.longName
                },{
                    from: "@NAME@",
                    to: options.shortName
                },{
                    from: "@EMAIL@",
                    to: options.email
                },{
                    from: "@WEBMASTERS@",
                    to: options.webmasters
                },{
                    from: "@BUILD_TIMESTAMP@",
                    to: buildTimestamp
                },{
                    from: "@BUILD_VERSION@",
                    to: "<%= pkg.version %>"
                },{
                    from: "@BUILD_NONCE@",
                    to: buildNonce
                }]
            },

            // Remove all development links <!-- link.dev --> and uncomment
            // all the release links <1-- link.prod -->
            links: {
                src: [
                   "build/worldview-debug/web/index.html",
                   "build/worldview-debug/web/pages/*.html",
                ],
                overwrite: true,
                replacements: [{
                    from: /.*link.dev.*/g,
                    to: ""
                }, {
                    from: /.*link.prod.*(!--|\/\*)(.*)(--|\*\/).*/g,
                    to: "$2"
                }]
            },

            // Adds RPM package name, version, release, and git revision
            // to the RPM spec file in the build directory
            rpm_sources: {
                src: [
                    "build/rpmbuild/SOURCES/*",
                    "build/rpmbuild/SPECS/*",
                    "!**/*.tar.bz2"
                ],
                overwrite: true,
                replacements: [{
                    from: "@WORLDVIEW@",
                    to: "<%= pkg.name %>"
                }, {
                    from: "@BUILD_VERSION@",
                    to: "<%= pkg.version %>"
                },{
                    from: "@BUILD_RELEASE@",
                    to: "<%= pkg.release %>"
                },{
                    from: "@GIT_REVISION@",
                    to: ".git<%= grunt.config.get('git-revision') %>"
                }]
            }
        },

        concat: {
            // Combine all the Worldview JavaScript files into one file.
            wv_js: {
                src: wvJs,
                dest: "build/worldview-debug/web/js/wv.js"
            },
            // Combine all the Worldview CSS files into one file.
            wv_css: {
                src: wvCss,
                dest: "build/worldview-debug/web/css/wv.css"
            }
        },

        uglify: {
            // Minifiy the concatenated Worldview JavaScript file.
            wv_js: {
                options: {
                    banner: banner
                },
                files: {
                    "build/worldview/web/js/wv.js": [
                        "build/worldview-debug/web/js/wv.js"
                    ]
                }
            }
        },

        cssmin: {
            // Minifiy the concatenated Worldview CSS file.
            wv_css: {
                options: {
                    banner: banner,
                    keepSpecialComments: false
                },
                files: {
                    "build/worldview/web/css/wv.css": [
                        "build/worldview-debug/web/css/wv.css"
                    ]
                }
            }
        },

        minjson: {
            main: {
                files: {
                    "build/worldview/web/conf/wv.json":
                    "build/worldview/web/conf/wv.json",
                    "build/worldview/web/conf/palettes.json":
                    "build/worldview/web/conf/palettes.json"
                }
            }
        },

        lineremover: {
            // After removing all the <!-- link.dev --> references, there
            // are a lot of blank lines in index.html. Remove them
            release: {
                files: {
                    "build/worldview/web/index.html":
                        "build/worldview/web/index.html"
                }
            }
        },

        yuidoc: {
            main: {
                name: "Worldview",
                description: "Interactive satellite imagery browser",
                version: "<%= pkg.version %>",
                url: "https://earthdata.nasa.gov/worldview",
                options: {
                    paths: ["src/js"],
                    outdir: "build/worldview-doc"
                }
            }
        },

        jshint: {
            console: [
                "src/js/**/wv.*.js",
                "test/**/*.js",
            ],
            report: {
                options: {
                    reporter: "checkstyle",
                },
                files: {
                    src: [
                        "src/js/**/wv.*.js",
                        "test/**/*.js",
                    ]
                }
            }
        },

        csslint: {
            main: {
                options: {
                    ids: false
                },
                src: ["src/css/wv.*.css"]
            }
        },

        buster: {
            console: {},
            report: {
                test: {
                    reporter: "xml"
                }
            }
        },

        remove: {
            build: ["build"],
            dist: ["dist"],
            // Removes all JavaScript, CSS, and auxillary files not necessary
            // in a release build. Place exceptions for JavaScript and
            // CSS here.
            source: [
                "build/worldview-debug/web/css/**/*.css",
                "build/worldview-debug/web/**/*.js",
                "!build/worldview-debug/web/css/wv.css",
                "!build/worldview-debug/web/js/wv.js",
                "!build/worldview-debug/web/css/bulkDownload.css",
                "!build/worldview-debug/web/js/map/wv.map.tileworker.js",
                "!build/worldview-debug/web/ext/**/*"
            ],
            conf_src: [
                "src/conf/**/*"
            ],
            dist_tar: ["dist/*.tar.bz2"],
            dist_rpm: ["dist/*.rpm"],
            rpmbuild: ["build/rpmbuild"]
        }

    });

    grunt.file.mkdir("build/rpmbuild");
    grunt.file.mkdir("dist");

    grunt.loadNpmTasks("grunt-buster");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-csslint");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-yuidoc");
    grunt.loadNpmTasks("grunt-line-remover");
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-git-rev-parse");
    grunt.loadNpmTasks("grunt-minjson");
    grunt.loadNpmTasks("grunt-text-replace");

    grunt.renameTask("clean", "remove");
    grunt.task.run("git-rev-parse");

    grunt.registerTask("config", [
        "clean",
        "remove:conf_src",
        "exec:update_gc",
        "exec:config"
    ]);

    grunt.registerTask("build", [
        "config",
        "copy:source",
        "concat",
        "replace:tokens",
        "replace:links",
        "remove:source",
        "copy:release",
        "uglify",
        "cssmin",
        "minjson",
        "lineremover",
        "exec:empty",
        "exec:cgi_echo",
        "exec:cgi_shorten",
        "doc",
        "remove:dist_tar",
        "exec:tar_debug_versioned",
        "exec:tar_debug",
        "exec:tar_release_versioned",
        "exec:tar_release",
        "exec:tar_doc_versioned",
        "exec:tar_doc"
    ]);

    grunt.registerTask("rpm_only", [
        "remove:rpmbuild",
        "copy:rpm_sources",
        "replace:rpm_sources",
        "remove:dist_rpm",
        "exec:rpmbuild",
        "copy:rpm"
    ]);

    grunt.registerTask("doc", ["yuidoc"]);
    grunt.registerTask("lint", ["jshint:console"]);
    grunt.registerTask("test", ["buster:console"]);
    grunt.registerTask("push", ["lint", "test"]);
    grunt.registerTask("rpm", ["build", "rpm_only"]);
    grunt.registerTask("clean", "remove:build");
    grunt.registerTask("distclean", ["remove:build", "remove:dist"]);

    grunt.registerTask("default", ["build"]);

};
