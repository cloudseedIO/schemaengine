/**
 * @author - Vikram
 */
var React = require("react");
//var ReactDOM = require('react-dom');
//var common=require('../../common.jsx');
//var global=require('../../../utils/global.js');

var RatingComponent = React.createClass({
  render: function() {
    var properties = this.props.properties;
    var ratingType = this.props.properties.dataType.ratingType;
    var data = this.props.data;
    var classList = {};
    if (ratingType == "star") {
      classList = { "fa-star-o": 1 };
    } else if (ratingType == "hand") {
      classList = { "fa-thumbs-o-down": "false", "fa-thumbs-o-up": "true" };
    } else if (ratingType == "smiley") {
      classList = {
        "fa-smile-o": "good",
        "fa-meh-o": "better",
        "fa-frown-o": "bad"
      };
    }
    return (
      <div className="row no-margin">
      	{ properties.dataType.best?<span className="hidden" itemProp="bestRating">{ properties.dataType.best}</span>:""}
      	{ properties.dataType.worst?<span className="hidden" itemProp="worstRating">{ properties.dataType.worst}</span>:""}
      	<span className="hidden" itemProp="ratingValue">{data}</span>
      
        <span className="star-thumb-group nohover">
          {Object.keys(classList).map(function(key, index) {
            var inputId = "";
            var result = [];
            var status = false;
            var selectedValue;
            if (ratingType == "star") {
              var temp = [];
              for (
                var i = properties.dataType.best;
                i >= properties.dataType.worst;
                i--
              ) {
                inputId = "star-" + i;
                selectedValue = "star-" + data;
                if (inputId == selectedValue) status = true;
                else status = false;

                temp.push(
                  <input type="radio" id={inputId} checked={status} value={i} />
                );
                temp.push(<label data-id={inputId} title={i + " star"} />);
              }
              result.push(
                <span className="rating star-cb-group nohover">{temp}</span>
              );
            } else {
              inputId = ratingType + "-" + classList[key];
              selectedValue = ratingType + "-" + data;
              if (inputId == selectedValue) status = true;
              else status = false;

              result.push(
                <span className="rating nohover">
                  <input
                    type="radio"
                    id={inputId}
                    checked={status}
                    value={classList[key]}
                  />
                  <label
                    data-id={inputId}
                    className={key}
                    title={classList[key]}
                  />
                </span>
              );
            }
            return result;
          })}
        </span>
      </div>
    );
  }
});
exports.RatingComponent = RatingComponent;
