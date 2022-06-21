const YAML = require("yaml");
const axios = require("axios");

module.exports = async (req, res) => {
  const url = req.query.url;
  const type = req.query.type || req.query.t || '';
  const country = req.query.country || req.query.c || '';
  const filterncountry = req.query.filterncountry || req.query.fnc || '';

  console.log(`query: ${JSON.stringify(req.query)}`);
  if (url === undefined) {
    res.status(400).send("Missing parameter: url");
    return;
  }

  console.log(`Fetching url: ${url}`);
  let configFile = null;
  try {
    const result = await axios({
      url,
      headers: {
        "User-Agent":
          "ClashX Pro/1.72.0.4 (com.west2online.ClashXPro; build:1.72.0.4; macOS 12.0.1) Alamofire/5.4.4",
      },
    });
    configFile = result.data;
  } catch (error) {
    res.status(400).send(`Unable to get url, error: ${error}`);
    return;
  }


  // const responseOri = YAML.stringify(configFile);
  res.status(200).send(configFile);
  return;

  console.log(`Parsing YAML`);
  let config = null;
  try {
    config = YAML.parse(configFile);
    console.log(`👌 Parsed YAML`);
  } catch (error) {
    res.status(500).send(`Unable parse config, error: ${error}`);
    return;
  }

  if (config.proxies === undefined) {
    res.status(400).send("No proxies in this config");
    return;
  }

  let filterTypes = type.split(',')
  let filterCountrys = country.split(',')
  let filterNCountrys = filterncountry.split(',')
  
  let proxiesNew = []

  // filterTypes = filterTypes.filter(value => ["ss", "vmess", "trojan", "ssr"].indexOf(value) !== -1);
  console.log(`filterTypes: ${JSON.stringify(filterTypes)}, filterCountrys: ${JSON.stringify(filterCountrys)}`);

  let proxiesOri = config.proxies
  if (proxiesOri.length > 0) {
    let filterTypesLength = filterTypes.length
    let filterCountrysLength = filterCountrys.length
    let filterNCountrysLength = filterNCountrys.length

    if (filterTypesLength > 0 || filterCountrysLength > 0 || filterNCountrysLength > 0) {
      // 有过滤条件
      for (let item of proxiesOri) {
        // "type":"trojan","country":"🏁ZZ"
        // console.log(item)
        let itemType = item.type || ''
        let itemCountry = item.country || ''
        let intype = false
        let incountry = false
        let inNcountry = false

        if (filterTypesLength > 0) {
          for (let s of filterTypes) {
            if (itemType.indexOf(s) > -1) {
              intype = true
              break
            }
          }
        } else {
          intype = true
        }

        if (filterCountrysLength > 0) {
          for (let s of filterCountrys) {
            if (itemCountry.indexOf(s) > -1) {
              incountry = true
              break
            }
          }
        } else {
          incountry = true
        }

        if (filterNCountrysLength > 0) {
          for (let s of filterNCountrys) {
            if (itemCountry.indexOf(s) > -1) {
              inNcountry = true
              break
            }
          }
        }

        if (intype && incountry && !inNcountry) {
          proxiesNew.push(item)
        }
      }
    } else {
      proxiesNew = proxiesOri
    }
  }

  const response = YAML.stringify({ proxies: proxiesNew });
  res.status(200).send(response);
};
