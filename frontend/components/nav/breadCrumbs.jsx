/**
 * @author - Vikram
 */


/**
 * Look for the current url in the navigation list 
 * if not then look with schema and ds
 * if it has inner elements loop again
 * if not look with landingpage
 * 
 * 
 * 
 */
var React = require("react");
var Link = require("react-router").Link;
var global = require("../../utils/global.js");
var genericNav = require("../nav/genericNav.jsx");
function getBreadCrumbs(data) {
  var schema = data.schema;
  var ds = data.dependentSchema;
  var landingPage = data.landingPage;
  var org = data.org ? data.org : "public";
  var noCurrent = data.noCurrent ? data.noCurrent : false;

  var navLinks = require("../../stores/DefinitionStore").getNavigationLinks();
  var navElements;
  for (var i = 0; i < navLinks.navs.length; i++) {
    if (navLinks.navs[i].org == org) {
      navElements = navLinks.navs[i].elements;
      break;
    }
  }

  var sublink = {
    dummy: true,
    displayName: schema,
    target: {
      create: "",
      methods: "",
      navViews: "",
      schema: schema,
      dependentSchema: ds
    }
  };
  return loopInner(navElements);

  function loopInner(elements,pos) {
    var breadCrumbs = [];
    var position=pos?pos:2;
    var found = false;
    var urlMatch=false;
    if (Array.isArray(elements)) {
      for (var i = 0; i < elements.length; i++) {
      	 if ((data.landingPage && elements[i].url && elements[i].url.toLowerCase()==data.landingPage.toLowerCase()) ||
      	 	(data.landingPage && elements[i].target.url && elements[i].target.url.toLowerCase()==data.landingPage.toLowerCase())) {
          	sublink = elements[i];
              breadCrumbs.push(
                <li
                  key={global.guid()}
                  className="breadcrumb-item"
                  itemProp="itemListElement"
                  itemScope="itemScope"
                  itemType="http://schema.org/ListItem"
                >
                  <Link
                    itemProp="item"
                    to={genericNav.getSubNavUrl(sublink, org)}
                  >
                    <span itemProp="name">
                      {sublink.breadCrumpName
                        ? sublink.breadCrumpName
                        : sublink.displayName}
                    </span>
                  </Link>
                  <meta itemProp="position" content={position} />
                </li>
              );
              position++;
              breadCrumbs.push(
                <span key={global.guid()} className="divider">
                  /
                </span>
              );
              found = true;
              urlMatch=true;
              break;
        }else if (schema != undefined && elements[i].target.schema == schema && elements[i].target.dependentSchema == ds){
          if (!noCurrent) {
            sublink = elements[i];
            breadCrumbs.push(
              <li
                key={global.guid()}
                className="breadcrumb-item"
                itemProp="itemListElement"
                itemScope="itemScope"
                itemType="http://schema.org/ListItem"
              >
                <Link
                  itemProp="item"
                  to={genericNav.getSubNavUrl(sublink, org)}
                >
                  <span itemProp="name">
                    {sublink.breadCrumpName
                      ? sublink.breadCrumpName
                      : sublink.displayName}
                  </span>
                </Link>
                <meta itemProp="position" content={position} />
              </li>
            );
            position++;
            breadCrumbs.push(
              <span key={global.guid()} className="divider">
                /
              </span>
            );
          }
          found = true;
          break;
        } else if (elements[i].target.elements) {
          if (
            landingPage != undefined &&
            elements[i].target.landingPage == landingPage
          ) {
            sublink = elements[i];
            breadCrumbs.push(
              <li
                key={global.guid()}
                className="breadcrumb-item"
                itemProp="itemListElement"
                itemScope="itemScope"
                itemType="http://schema.org/ListItem"
              >
                <Link
                  itemProp="item"
                  to={genericNav.getSubNavUrl(sublink, org)}
                >
                  <span itemProp="name">
                    {sublink.breadCrumpName
                      ? sublink.breadCrumpName
                      : sublink.displayName}
                  </span>
                </Link>
                <meta itemProp="position" content={position} />
              </li>
            );
            position++;
            breadCrumbs.push(
              <span key={global.guid()} className="divider">
                /
              </span>
            );
            found = true;
            break;
          } else {
            var result = loopInner(elements[i].target.elements,position+1);
            if (result.found) {
              var bds = [];
              if (elements[i].landingPage || elements[i].url) {
                bds.push(
                  <li
                    key={global.guid()}
                    className="breadcrumb-item"
                    itemProp="itemListElement"
                    itemScope="itemScope"
                    itemType="http://schema.org/ListItem"
                  >
                    <Link
                      itemProp="item"
                      to={"/" + (elements[i].landingPage || elements[i].url)}
                    >
                      <span itemProp="name">
                        {elements[i].breadCrumpName
                          ? elements[i].breadCrumpName
                          : elements[i].displayName}
                      </span>
                    </Link>
                    <meta itemProp="position" content={position} />
                  </li>
                );
                position++;
                bds.push(
                  <span key={global.guid()} className="divider">
                    /
                  </span>
                );
              }
              if (elements[i].target.landingPage || elements[i].target.url) {
                bds.push(
                  <li
                    key={global.guid()}
                    className="breadcrumb-item"
                    itemProp="itemListElement"
                    itemScope="itemScope"
                    itemType="http://schema.org/ListItem"
                  >
                    <Link
                      itemProp="item"
                      to={genericNav.getSubNavUrl(elements[i], org)}
                    >
                      <span itemProp="name">
                        {elements[i].breadCrumpName
                          ? elements[i].breadCrumpName
                          : elements[i].displayName}
                      </span>
                    </Link>
                    <meta itemProp="position" content={position} />
                  </li>
                );
                position++;
                bds.push(
                  <span key={global.guid()} className="divider">
                    /
                  </span>
                );
              }
              position=result.position;
              breadCrumbs = bds.concat(result.breadCrumbs);
              found = true;
              urlMatch=result.urlMatch;
              break;
            }
          }
        } else if (elements[i].target.landingPage) {
          var lookingForLanding =
            landingPage != undefined &&
            elements[i].target.landingPage == landingPage;
          if (
            (elements[i].target.schemas &&
              elements[i].target.schemas.indexOf(schema) > -1) ||
            lookingForLanding
          ) {
            if (
              lookingForLanding ||
              (!elements[i].target.dependentSchemas && !ds) ||
              (ds &&
                elements[i].target.dependentSchemas &&
                elements[i].target.dependentSchemas.indexOf(ds) > -1)
            ) {
              sublink = elements[i];
              breadCrumbs.push(
                <li
                  key={global.guid()}
                  className="breadcrumb-item"
                  itemProp="itemListElement"
                  itemScope="itemScope"
                  itemType="http://schema.org/ListItem"
                >
                  <Link
                    itemProp="item"
                    to={genericNav.getSubNavUrl(sublink, org)}
                  >
                    <span itemProp="name">
                      {sublink.breadCrumpName
                        ? sublink.breadCrumpName
                        : sublink.displayName}
                    </span>
                  </Link>
                  <meta itemProp="position" content={position} />
                </li>
              );
              position++;
              breadCrumbs.push(
                <span key={global.guid()} className="divider">
                  /
                </span>
              );
              found = true;
              break;
            }
          }
        }
      }
    }

    return { breadCrumbs: breadCrumbs, found: found ,position:position,urlMatch:urlMatch};
  }
}
exports.getBreadCrumbs = getBreadCrumbs;
