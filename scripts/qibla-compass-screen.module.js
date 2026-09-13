__d(function (g, _r, i, a, m, e, d) {
  var t = _r(d[0]);
  Object.defineProperty(e, "__esModule", { value: !0 }),
    (e.QiblaCompassScreen = function () {
      const t = (0, f.useRouter)(),
        nav = (0, f.useNavigation)(),
        { height: winH } = (0, dim.default)(),
        R = winH < 740,
        { settings: cfg } = (0, h.useAppAppearanceSettings)(),
        y = (0, b.useQiblaCompass)(cfg.prayerCity, cfg.prayerCountry),
        [F, K] = (0, n.useState)(!1),
        x = (0, n.useMemo)(
          () => (null == y.qiblaBearing ? "\u2014" : Math.round(y.qiblaBearing) + "\xb0"),
          [y.qiblaBearing]
        ),
        k = (0, n.useMemo)(
          () => (null == y.distanceKm ? "\u2014" : y.distanceKm.toFixed(1) + " km"),
          [y.distanceKm]
        ),
        w = -(y.deviceHeading ?? 0),
        S = y.qiblaBearing ?? 0,
        q = (0, bg.resolvePrayerBackgroundSource)(cfg.prayerBackgroundId, cfg.backgroundImageUri),
        size = R ? 228 : 280;
      (0, f.useFocusEffect)(
        (0, n.useCallback)(() => {
          const parent = nav.getParent();
          nav.setOptions?.({ tabBarStyle: T }), parent?.setOptions({ tabBarStyle: T });
          const o = setTimeout(() => {
            parent?.setOptions({ tabBarStyle: T });
          }, 50);
          return () => {
            clearTimeout(o), parent?.setOptions({ tabBarStyle: void 0 });
          };
        }, [nav])
      );
      const locSrc =
        "city" === y.locationSource ? " \xb7 \u015fehir" : "gps" === y.locationSource ? " \xb7 GPS" : "";
      return (0, p.jsxs)(c.default, {
        style: z.root,
        children: [
          (0, p.jsxs)(Img.default, {
            source: q,
            style: z.bg,
            imageStyle: z.bgImg,
            children: [
              (0, p.jsx)(c.default, { style: z.bgScrim }),
              (0, p.jsx)(W, {}),
              (0, p.jsxs)(Scroll.default, {
                style: z.scroll,
                contentContainerStyle: [z.scrollContent, R && z.scrollContentCompact],
                showsVerticalScrollIndicator: !1,
                bounces: !1,
                children: [
                  (0, p.jsxs)(c.default, {
                    style: z.topRow,
                    children: [
                      (0, p.jsxs)(c.default, {
                        style: z.cityBlock,
                        children: [
                          (0, p.jsxs)(c.default, {
                            style: z.cityLine,
                            children: [
                              (0, p.jsx)(l.default, {
                                style: z.iconBtn,
                                onPress: () => t.back(),
                                accessibilityLabel: "Geri",
                                children: (0, p.jsx)(u.MaterialCommunityIcons, {
                                  name: "arrow-left",
                                  size: 24,
                                  color: "#f7fffb",
                                }),
                              }),
                              (0, p.jsx)(s.default, {
                                style: [z.city, R && z.cityCompact],
                                children: cfg.prayerCity,
                              }),
                            ],
                          }),
                          (0, p.jsx)(s.default, {
                            style: z.nextHint,
                            children: "K\u0131ble pusulas\u0131",
                          }),
                        ],
                      }),
                      (0, p.jsx)(l.default, {
                        style: z.mapChip,
                        onPress: () => {
                          y.refreshLocation();
                        },
                        accessibilityLabel: "Harita / konumu yenile",
                        children: (0, p.jsx)(u.MaterialCommunityIcons, {
                          name: "map-outline",
                          size: 20,
                          color: "#e8fff8",
                        }),
                      }),
                    ],
                  }),
                  (0, p.jsxs)(c.default, {
                    style: z.heroStage,
                    children: [
                      (0, p.jsxs)(c.default, {
                        style: [z.heroCard, R && z.heroCardCompact],
                        children: [
                          y.loading && null == y.qiblaBearing
                            ? (0, p.jsx)(o.default, { color: "#fff", size: "large", style: z.loader })
                            : null,
                          (0, p.jsxs)(c.default, {
                            style: [z.compassStage, { width: size, height: size }],
                            children: [
                              (0, p.jsx)(c.default, { style: z.lubber }),
                              (0, p.jsxs)(c.default, {
                                style: [
                                  z.dial,
                                  {
                                    width: size,
                                    height: size,
                                    borderRadius: size / 2,
                                    transform: [{ rotate: w + "deg" }],
                                  },
                                ],
                                children: [
                                  (0, p.jsx)(j, { size: size }),
                                  (0, p.jsx)(C, { size: size }),
                                  (0, p.jsx)(s.default, { style: [z.cardinal, z.cardinalN], children: "N" }),
                                  (0, p.jsx)(s.default, { style: [z.cardinal, z.cardinalE], children: "E" }),
                                  (0, p.jsx)(s.default, { style: [z.cardinal, z.cardinalS], children: "S" }),
                                  (0, p.jsx)(s.default, { style: [z.cardinal, z.cardinalW], children: "W" }),
                                  (0, p.jsxs)(c.default, {
                                    style: [
                                      z.qiblaMarker,
                                      { width: size, height: size, transform: [{ rotate: S + "deg" }] },
                                    ],
                                    children: [
                                      (0, p.jsx)(c.default, { style: z.qiblaArrow }),
                                      (0, p.jsxs)(c.default, {
                                        style: z.kaabaBadge,
                                        children: [
                                          (0, p.jsx)(c.default, { style: z.kaabaCube }),
                                          (0, p.jsx)(c.default, { style: z.kaabaBand }),
                                          (0, p.jsx)(c.default, { style: z.kaabaDoor }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, p.jsx)(c.default, {
                                    style: [z.levelDot, y.aligned && z.levelDotAligned],
                                    children: y.aligned
                                      ? (0, p.jsx)(u.MaterialCommunityIcons, {
                                          name: "check",
                                          size: 18,
                                          color: "#0f3d32",
                                        })
                                      : null,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          (0, p.jsx)(s.default, {
                            style: [z.bigDegrees, R && z.bigDegreesCompact],
                            children: x,
                          }),
                          (0, p.jsx)(s.default, {
                            style: z.heroUnits,
                            children: "k\u0131ble a\xe7\u0131s\u0131",
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, p.jsxs)(c.default, {
                    style: z.timesPanel,
                    children: [
                      (0, p.jsxs)(c.default, {
                        style: [z.timeRow, z.timeRowBorder],
                        children: [
                          (0, p.jsxs)(c.default, {
                            style: z.timeLeft,
                            children: [
                              (0, p.jsx)(c.default, { style: z.idleDot }),
                              (0, p.jsx)(s.default, {
                                style: z.timeLabel,
                                children: "K\u0131ble A\xe7\u0131s\u0131",
                              }),
                            ],
                          }),
                          (0, p.jsx)(s.default, { style: z.timeValue, children: x }),
                        ],
                      }),
                      (0, p.jsxs)(c.default, {
                        style: [
                          z.timeRow,
                          y.locationLabel ||
                          y.locationNote ||
                          y.orientationNote ||
                          y.calibrationHint ||
                          y.needsOrientationGesture ||
                          y.aligned
                            ? z.timeRowBorder
                            : null,
                        ],
                        children: [
                          (0, p.jsxs)(c.default, {
                            style: z.timeLeft,
                            children: [
                              (0, p.jsx)(c.default, { style: z.idleDot }),
                              (0, p.jsx)(s.default, { style: z.timeLabel, children: "Uzakl\u0131k" }),
                            ],
                          }),
                          (0, p.jsx)(s.default, { style: z.timeValue, children: k }),
                        ],
                      }),
                      y.locationLabel
                        ? (0, p.jsxs)(c.default, {
                            style: [z.timeRow, y.aligned && z.timeRowActive],
                            children: [
                              (0, p.jsxs)(c.default, {
                                style: z.timeLeft,
                                children: [
                                  (0, p.jsx)(c.default, {
                                    style: y.aligned ? z.activeDot : z.idleDot,
                                  }),
                                  (0, p.jsx)(s.default, {
                                    style: [z.timeLabel, y.aligned && z.timeLabelActive],
                                    children: "Konum",
                                  }),
                                ],
                              }),
                              (0, p.jsxs)(s.default, {
                                style: [z.timeValue, z.timeValueSmall, y.aligned && z.timeValueActive],
                                children: [y.locationLabel, locSrc],
                              }),
                            ],
                          })
                        : null,
                      y.locationNote
                        ? (0, p.jsx)(s.default, { style: z.warn, children: y.locationNote })
                        : null,
                      y.orientationNote
                        ? (0, p.jsx)(s.default, { style: z.warn, children: y.orientationNote })
                        : null,
                      y.calibrationHint
                        ? (0, p.jsx)(s.default, { style: z.calibrate, children: y.calibrationHint })
                        : null,
                      y.needsOrientationGesture
                        ? (0, p.jsxs)(l.default, {
                            style: z.cta,
                            onPress: () => {
                              y.requestOrientationPermission();
                            },
                            children: [
                              (0, p.jsx)(u.MaterialCommunityIcons, {
                                name: "compass-outline",
                                size: 20,
                                color: "#fff",
                              }),
                              (0, p.jsx)(s.default, {
                                style: z.ctaLabel,
                                children: "Pusulay\u0131 a\xe7 (izin ver)",
                              }),
                            ],
                          })
                        : null,
                      y.aligned
                        ? (0, p.jsx)(s.default, {
                            style: z.alignedMsg,
                            children: "K\u0131bleye hizal\u0131s\u0131n\u0131z",
                          })
                        : null,
                    ],
                  }),
                ],
              }),
            ],
          }),
          (0, p.jsx)(c.default, {
            style: z.bottomBar,
            children: v.map((o) =>
              (0, p.jsxs)(
                l.default,
                {
                  style: z.bottomItem,
                  onPress: () => {
                    null === o.route ? K(!0) : "/pusula" === o.route ? null : t.push(o.route);
                  },
                  children: [
                    (0, p.jsx)(u.MaterialCommunityIcons, {
                      name: o.icon,
                      size: 22,
                      color: "/pusula" === o.route ? "#9fd9cf" : "#f2fffa",
                    }),
                    (0, p.jsx)(s.default, {
                      style: [z.bottomLabel, "/pusula" === o.route && z.bottomLabelActive],
                      children: o.label,
                    }),
                  ],
                },
                o.label
              )
            ),
          }),
          (0, p.jsx)(sheet.VakitlerMenuSheet, { visible: F, onClose: () => K(!1) }),
        ],
      });
    });
  var n = _r(d[1]),
    o = t(_r(d[2])),
    Img = t(_r(d[3])),
    l = (t(_r(d[4])), t(_r(d[5]))),
    Scroll = t(_r(d[6])),
    st = t(_r(d[7])),
    s = t(_r(d[8])),
    dim = t(_r(d[9])),
    c = t(_r(d[10])),
    u = _r(d[11]),
    f = _r(d[12]),
    sheet = _r(d[13]),
    h = _r(d[14]),
    b = _r(d[15]),
    bg = _r(d[16]),
    p = _r(d[17]);
  function j({ size: size }) {
    const t = [];
    for (let n = 0; n < 360; n += 2) {
      const o = n % 30 == 0,
        l = o ? 14 : n % 10 == 0 ? 9 : 5;
      t.push(
        (0, p.jsx)(
          c.default,
          {
            style: [z.tickWrap, { width: size, height: size, transform: [{ rotate: n + "deg" }] }],
            children: (0, p.jsx)(c.default, {
              style: [z.tick, { height: l, backgroundColor: o ? "#222" : "#bdbdbd", width: o ? 2 : 1 }],
            }),
          },
          "t-" + n
        )
      );
    }
    return (0, p.jsx)(p.Fragment, { children: t });
  }
  function C({ size: size }) {
    const x = size / 2,
      rad = x * 0.743;
    return (0, p.jsx)(p.Fragment, {
      children: [30, 60, 120, 150, 210, 240, 300, 330].map((t) => {
        const n = ((t - 90) * Math.PI) / 180,
          o = x + rad * Math.cos(n),
          l = x + rad * Math.sin(n);
        return (0, p.jsx)(
          s.default,
          { style: [z.degLabel, { left: o - 14, top: l - 8, width: 28 }], children: t },
          "d-" + t
        );
      }),
    });
  }
  function W() {
    return (0, p.jsxs)(c.default, {
      style: z.orbs,
      pointerEvents: "none",
      children: [
        (0, p.jsx)(c.default, { style: [z.orb, z.orbTL] }),
        (0, p.jsx)(c.default, { style: [z.orb, z.orbBR] }),
        (0, p.jsx)(c.default, { style: [z.orb, z.orbBL] }),
      ],
    });
  }
  const v = [
      { icon: "book-open-page-variant", label: "Kuran", route: "/kuran" },
      { icon: "cog-outline", label: "Ayarlar", route: "/ayarlar" },
      { icon: "compass-outline", label: "Pusula", route: "/pusula" },
      { icon: "calendar-clock", label: "\u0130msakiye", route: "/imsakiye" },
      { icon: "dots-horizontal", label: "Men\xfc", route: null },
    ],
    T = { display: "none", height: 0, overflow: "hidden" },
    glass = "rgba(255,255,255,0.14)";
  const z = st.default.create({
    root: { flex: 1, backgroundColor: "#14352c" },
    bg: { flex: 1 },
    bgImg: { resizeMode: "cover", opacity: 0.42 },
    bgScrim: Object.assign({}, st.default.absoluteFillObject, {
      backgroundColor: "rgba(12, 36, 30, 0.72)",
    }),
    orbs: Object.assign({}, st.default.absoluteFillObject, { zIndex: 0 }),
    orb: { position: "absolute", borderRadius: 999, opacity: 0.22 },
    orbTL: { width: 220, height: 220, top: -60, left: -70, backgroundColor: "#2f6b5a" },
    orbBR: { width: 260, height: 260, bottom: 40, right: -90, backgroundColor: "#c4a484" },
    orbBL: { width: 160, height: 160, bottom: 120, left: -40, backgroundColor: "#5fa88f" },
    scroll: { flex: 1, zIndex: 2 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 104 },
    scrollContentCompact: { paddingTop: 10 },
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    cityBlock: { flex: 1, paddingRight: 12 },
    cityLine: { flexDirection: "row", alignItems: "center", gap: 4 },
    iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },
    city: {
      color: "#f7fffb",
      fontSize: 30,
      fontWeight: "700",
      letterSpacing: -0.8,
      fontFamily: "Georgia, serif",
    },
    cityCompact: { fontSize: 24 },
    nextHint: {
      marginTop: 2,
      marginLeft: 36,
      color: "rgba(232,255,248,0.78)",
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    mapChip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: glass,
      borderRadius: 999,
      width: 44,
      height: 44,
      borderWidth: st.default.hairlineWidth,
      borderColor: "rgba(255,255,255,0.22)",
    },
    heroStage: {
      flexGrow: 1,
      minHeight: 320,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
    },
    heroCard: {
      backgroundColor: glass,
      borderRadius: 28,
      paddingVertical: 22,
      paddingHorizontal: 24,
      alignItems: "center",
      borderWidth: st.default.hairlineWidth,
      borderColor: "rgba(255,255,255,0.28)",
    },
    heroCardCompact: { paddingVertical: 16, borderRadius: 24, paddingHorizontal: 16 },
    compassStage: { alignItems: "center", justifyContent: "center", marginBottom: 10 },
    lubber: {
      position: "absolute",
      top: 2,
      zIndex: 5,
      width: 3,
      height: 18,
      borderRadius: 1,
      backgroundColor: "#e53935",
    },
    dial: {
      backgroundColor: "rgba(255,255,255,0.96)",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.22,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
      borderWidth: st.default.hairlineWidth,
      borderColor: "rgba(255,255,255,0.7)",
    },
    tickWrap: { position: "absolute", alignItems: "center" },
    tick: { marginTop: 4, borderRadius: 1 },
    degLabel: { position: "absolute", textAlign: "center", fontSize: 11, color: "#9e9e9e", fontWeight: "500" },
    cardinal: { position: "absolute", color: "#111", fontSize: 16, fontWeight: "700" },
    cardinalN: { top: 22 },
    cardinalS: { bottom: 22 },
    cardinalE: { right: 22 },
    cardinalW: { left: 22 },
    qiblaMarker: { position: "absolute", alignItems: "center", paddingTop: 22 },
    qiblaArrow: {
      width: 0,
      height: 0,
      borderLeftWidth: 7,
      borderRightWidth: 7,
      borderBottomWidth: 12,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderBottomColor: "#e53935",
      marginBottom: 4,
    },
    kaabaBadge: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: "#1a1a1a",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#c9a227",
    },
    kaabaCube: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: "#111",
    },
    kaabaBand: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 11,
      height: 7,
      backgroundColor: "#c9a227",
      opacity: 0.9,
    },
    kaabaDoor: {
      position: "absolute",
      width: 7,
      height: 10,
      bottom: 3,
      backgroundColor: "#c9a227",
      borderRadius: 1,
    },
    levelDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: "#66bb6a",
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    levelDotAligned: { backgroundColor: "#9fd9cf", borderColor: "#0f3d32" },
    bigDegrees: {
      fontSize: 56,
      fontWeight: "700",
      color: "#fff",
      letterSpacing: -2,
      marginTop: 8,
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontVariant: ["tabular-nums"],
    },
    bigDegreesCompact: { fontSize: 44 },
    heroUnits: {
      marginTop: 2,
      color: "rgba(247,255,251,0.7)",
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    loader: { marginBottom: 16 },
    timesPanel: {
      backgroundColor: "rgba(255,255,255,0.94)",
      borderRadius: 24,
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderWidth: st.default.hairlineWidth,
      borderColor: "rgba(255,255,255,0.55)",
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
      marginTop: 8,
    },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: 16,
      marginHorizontal: 6,
      marginVertical: 2,
    },
    timeRowBorder: {
      borderBottomWidth: st.default.hairlineWidth,
      borderBottomColor: "rgba(20,53,44,0.1)",
      borderRadius: 0,
      marginHorizontal: 14,
      paddingHorizontal: 6,
    },
    timeRowActive: {
      backgroundColor: "rgba(159,217,207,0.55)",
      borderBottomWidth: 0,
      marginHorizontal: 6,
      paddingHorizontal: 14,
      borderRadius: 16,
    },
    timeLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#0f3d32" },
    idleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(20,53,44,0.18)" },
    timeLabel: { fontSize: 16, fontWeight: "600", color: "#2a3f38", letterSpacing: 0.1 },
    timeLabelActive: { color: "#0f2f28", fontWeight: "800" },
    timeValue: {
      fontSize: 22,
      fontWeight: "700",
      color: "#142820",
      fontVariant: ["tabular-nums"],
      letterSpacing: -0.3,
      fontFamily: "Georgia, serif",
    },
    timeValueSmall: { fontSize: 15 },
    timeValueActive: { color: "#0b241e" },
    warn: {
      marginTop: 8,
      marginHorizontal: 14,
      fontSize: 13,
      color: "#c62828",
      textAlign: "center",
      lineHeight: 18,
    },
    calibrate: {
      marginTop: 8,
      marginHorizontal: 14,
      fontSize: 13,
      color: "#546e7a",
      textAlign: "center",
      lineHeight: 18,
    },
    cta: {
      marginTop: 12,
      marginHorizontal: 12,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#0f3d32",
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 14,
    },
    ctaLabel: { color: "#fff", fontWeight: "700", fontSize: 15 },
    alignedMsg: {
      marginTop: 8,
      marginBottom: 10,
      color: "#2e7d32",
      fontWeight: "700",
      fontSize: 15,
      textAlign: "center",
    },
    bottomBar: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      backgroundColor: "rgba(20, 28, 26, 0.94)",
      paddingTop: 10,
      paddingBottom: 10,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderTopWidth: st.default.hairlineWidth,
      borderColor: "rgba(255,255,255,0.12)",
    },
    bottomItem: { alignItems: "center", minWidth: 56, gap: 3 },
    bottomLabel: { color: "rgba(242,255,250,0.9)", fontSize: 10, fontWeight: "600", letterSpacing: 0.2 },
    bottomLabelActive: { color: "#9fd9cf", fontWeight: "800" },
  });
}, 1019, [20, 15, 466, 470, 21, 372, 284, 160, 148, 498, 276, 622, 22, 1030, 773, 1020, 776, 13]);
