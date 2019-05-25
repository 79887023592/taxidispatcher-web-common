var db = require('./db');

function isPointInsidePolygon (coordsList, xd, yd) {
	var i1, i2, n, pcount, //int
		S, S1, S2, S3, x, y, //long
		flag = false;

	x = Math.round(xd * 1000);
	y = Math.round(yd * 1000);

	if (!coordsList || !coordsList.length || coordsList.length <= 2) {
		return false;
	}

	pcount = coordsList.length;
	var p = {}, i = 0;

	//for (var i = 0; i < pcount; i++)	{
	coordsList.forEach(function(coord) {
		p[i] = {};
		p[i][1] = Math.round(coord.lat * 1000);
		p[i][0] = Math.round(coord.lon * 1000);
		i++;
	});

	for (n = 0; n < pcount; n++) {

		flag = false;
		i1 = n < (pcount - 1) ? (n + 1) : 0;

		while (!flag) {
			i2 = i1 + 1;

			if (i2 >= pcount) {
				i2 = 0;
			}

			if (i2 == (n < (pcount - 1) ? (n + 1) : 0)) {
				break;
			}

			S = Math.abs( p[i1][0] * (p[i2][1] - p[n][1]) +
				p[i2][0] * (p[n][1] - p[i1][1]) +
				p[n][0]  * (p[i1][1] - p[i2][1]) );
			S1 = Math.abs( p[i1][0] * (p[i2][1] - y) +
				p[i2][0] * (y       - p[i1][1]) +
				x * (p[i1][1] - p[i2][1]) );
			S2 = Math.abs( p[n][0] * (p[i2][1] - y) +
				p[i2][0] * (y       - p[n][1]) +
				x * (p[n][1] - p[i2][1]) );
			S3 = Math.abs( p[i1][0] * (p[n][1] - y) +
				p[n][0] * (y       - p[i1][1]) +
				x * (p[i1][1] - p[n][1]) );

			if (S == S1 + S2 + S3) {
				flag = true;
				break;
			}

			i1 = i1 + 1;
			if (i1 >= pcount) {
				i1 = 0;
			}
		}

		if (!flag) {
			break;
		}
	}

	return flag;
}

function getSectorsCoordinates(sectorsList, bbox, connection, onSuccess) {
	db.queryRequest('SELECT sc.*, dc.Naimenovanie, al.* FROM Sektor_raboty sc INNER JOIN Spravochnik dc ON sc.BOLD_ID = dc.BOLD_ID INNER JOIN AREA_LINES al ON sc.BOLD_ID = al.SECTOR_ID ORDER BY sc.BOLD_ID ASC, al.order_num ASC',
		function (recordset) {
			if (recordset && recordset.recordset &&
				recordset.recordset.length) {
				var sectorCoordsList = recordset.recordset;
				//console.log(sectorCoordsList);
				sectorCoordsList.forEach(function(sectorCoord) {
					if (!sectorsList[sectorCoord.BOLD_ID]) {
						sectorsList[sectorCoord.BOLD_ID] = {
							name: sectorCoord.Naimenovanie,
							districtId: sectorCoord.district_id,
							coords: []
						}
					}

					if (bbox.minLat === false || bbox.minLat > sectorCoord.lat) {
						bbox.minLat = sectorCoord.lat;
					}

					if (bbox.minLon === false || bbox.minLon > sectorCoord.lon) {
						bbox.minLon = sectorCoord.lon;
					}

					if (bbox.maxLat === false || bbox.maxLat < sectorCoord.lat) {
						bbox.maxLat = sectorCoord.lat;
					}

					if (bbox.maxLon === false || bbox.maxLon < sectorCoord.lon) {
						bbox.maxLon = sectorCoord.lon;
					}

					sectorsList[sectorCoord.BOLD_ID].coords.push({
						lat: sectorCoord.lat,
						lon: sectorCoord.lon
					});
				});
			}

			//console.log(sectors);
			onSuccess && onSuccess();
		},
		function (err) {
			setTimeout(getSectorsCoordinates(sectorsList), 5000);
			console.log('Err of sectors coordinates request! ' + err);
		},
		connection);
}

module.exports.isPointInsidePolygon = isPointInsidePolygon;
module.exports.getSectorsCoordinates = getSectorsCoordinates;
