// Traced against the shipped 1672 × 941 scene photographs, in source pixels.
// Keep geometry separate from investigation content. Re-trace when art changes.
export const sceneImageSize = { width: 1672, height: 941 };
const object = (points, details = [], dashed = false) => {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const left = Math.min(...xs), top = Math.min(...ys);
  const width = Math.max(...xs) - left, height = Math.max(...ys) - top;
  const path = (vertices, closed = false) => vertices.map(([x, y], i) =>
    `${i ? "L" : "M"}${x - left} ${y - top}`).join(" ") + (closed ? " Z" : "");
  // Find a point with room for the whole marker, including concave objects.
  let marker = { x: left + width / 2, y: top + height / 2, clearance: 0 };
  for (let row = 1; row < 40; row++) for (let col = 1; col < 40; col++) {
    const x = left + width * col / 40, y = top + height * row / 40;
    let inside = false, distance = Infinity;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [ax, ay] = points[j], [bx, by] = points[i];
      if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
      const dx = bx - ax, dy = by - ay;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
      distance = Math.min(distance, Math.hypot(x - ax - t * dx, y - ay - t * dy));
    }
    if (inside && distance > marker.clearance) marker = { x, y, clearance: distance };
  }
  return {
    markerX: (marker.x - left) / width,
    markerY: (marker.y - top) / height,
    markerDiameter: marker.clearance * 1.8,
    x: (left + width / 2) / sceneImageSize.width * 100,
    y: (top + height / 2) / sceneImageSize.height * 100,
    width: width / sceneImageSize.width * 100,
    height: height / sceneImageSize.height * 100,
    viewBox: `0 0 ${width} ${height}`,
    path: path(points, true),
    details: details.map(vertices => path(vertices)),
    dashed,
  };
};

const objects = {
  bakery: {
    customer: object([[114,274],[143,259],[171,258],[192,266],[212,278],[226,296],[221,319],[222,341],[233,363],[222,371],[217,385],[213,399],[199,412],[178,416],[188,431],[215,463],[231,503],[247,535],[256,544],[266,550],[276,554],[288,552],[302,559],[306,572],[310,586],[302,607],[301,624],[274,636],[259,638],[258,612],[249,596],[233,577],[223,556],[214,537],[204,512],[188,487],[174,471],[158,457],[144,437],[125,427],[107,415],[115,395],[121,376],[105,350],[95,328]]),
    ledger: object([[607,718],[620,710],[775,677],[784,678],[981,704],[989,716],[994,717],[1010,721],[1136,773],[1145,783],[1141,794],[846,836],[832,835],[715,773],[710,762],[696,760],[616,731]], [[[620,718],[696,747],[710,754],[725,761],[740,749],[981,713]]]),
    debt: object([[1520,486],[1575,491],[1564,533],[1544,535],[1541,556],[1502,557]], [[[1540,487],[1540,475],[1549,474],[1550,488]]]),
    receipt: object([[1140,772],[1212,747],[1321,783],[1305,793],[1205,811],[1144,785]]),
    contract: object([[1545,535],[1619,541],[1601,591],[1576,591],[1534,578]]),
    transfer: object([[1040,722],[1100,705],[1200,741],[1199,748],[1106,762],[1040,735]], [[[1045,728],[1106,755],[1198,742]]]),
  },
  newshop: {
    rent: object([[98,468],[122,469],[248,487],[251,492],[216,510],[90,488]]),
    renovation: object([[558,727],[638,723],[641,712],[777,709],[783,720],[793,722],[883,777],[913,794],[916,801],[670,821],[637,788],[632,777]], [[[641,713],[644,734],[779,731],[777,709]]]),
    // A measured, still empty equipment bay: follow the wall/floor perspective.
    equipment: object([[1182,375],[1607,347],[1607,663],[1646,747],[1447,745],[1148,594]], [], true),
    preparation: object([[532,759],[585,762],[637,772],[631,811],[533,811]], [[[533,805],[627,805],[637,772]]]),
    survey: object([[671,352],[714,330],[752,342],[745,350],[727,361],[704,351],[683,359]]),
    invitation: object([[782,291],[807,296],[838,296],[798,343],[788,347],[781,349],[774,369],[745,369],[744,352]]),
  },
  desk: {
    workbench: object([[490,711],[535,720],[658,714],[722,715],[789,757],[849,796],[810,801],[583,785],[561,770],[529,741]]),
  },
  bank: {
    workbench: object([[648,708],[663,696],[849,698],[918,682],[1116,591],[1273,570],[1247,604],[1206,611],[1192,641],[1180,658],[1224,680],[1274,696],[1322,744],[1379,752],[1017,766],[655,766]], [[[918,682],[951,704],[992,719],[1003,741],[1017,750],[1017,766]]]),
  },
};

export function sceneObject(sceneId, spotId) {
  return objects[sceneId]?.[spotId];
}
