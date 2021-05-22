/*
 * @author naveed
 */
/*var React=require('react');
var ReactDOM = require('react-dom');
var global=require('../../../utils/global.js');
var common=require('../../common.jsx');*/
var WebUtils = require("../../../utils/WebAPIUtils.js");

function exportPPT(data, schemaName) {
  var pptx = new PptxGenJS();
  if (schemaName == "IdeaBoard") {
    var slide = pptx.addNewSlide();
    slide.addText(data.name, {
      x: 0.6,
      y: "3%",
      w: "50%",
      h: 0.5,
      align: "left",
      font_size: 24,
      color: "808080",
      fill: "FFFFFF"
    });
    slide.addText(data.description, {
      x: 0.6,
      y: "35%",
      w: "50%",
      h: 1.5,
      align: "left",
      font_size: 14,
      color: "000000",
      fill: "FFFFFF"
    });

    var copyright = "";
    WebUtils.doPost(
      "/schema?operation=getRecord",
      { name: data.architect },
      function(result) {
        if (result.data) {
          var y = 0.65;
          var inc = 0;
          if (result.data.name) {
            copyright = "Copyright " + result.data.name;
            slide.addText(result.data.name, {
              x: "80%",
              y: y,
              w: "2.0",
              h: 0.2,
              align: "left",
              font_size: 10,
              color: "808080",
              fill: "FFFFFF"
            });
            inc += 0.2;
          }
          if (result.data.address) {
            if (result.data.address.streetAddress) {
              slide.addText(result.data.address.streetAddress, {
                x: "80%",
                y: y + inc,
                w: "2.0",
                h: 0.2,
                align: "left",
                font_size: 10,
                color: "808080",
                fill: "FFFFFF"
              });
              inc += 0.2;
            }
            if (result.data.address.addressLocality) {
              slide.addText(result.data.address.addressLocality, {
                x: "80%",
                y: y + inc,
                w: "2.0",
                h: 0.2,
                align: "left",
                font_size: 10,
                color: "808080",
                fill: "FFFFFF"
              });
              inc += 0.2;
            }
            if (result.data.address.addressRegion) {
              slide.addText(result.data.address.addressRegion, {
                x: "80%",
                y: y + inc,
                w: "2.0",
                h: 0.2,
                align: "left",
                font_size: 10,
                color: "808080",
                fill: "FFFFFF"
              });
              inc += 0.2;
            }
            if (result.data.address.addressCountry) {
              slide.addText(result.data.address.addressCountry, {
                x: "80%",
                y: y + inc,
                w: "2.0",
                h: 0.2,
                align: "left",
                font_size: 10,
                color: "808080",
                fill: "FFFFFF"
              });
              inc += 0.2;
            }
            if (result.data.address.postalCode) {
              slide.addText(result.data.address.postalCode, {
                x: "80%",
                y: y + inc,
                w: "2.0",
                h: 0.2,
                align: "left",
                font_size: 10,
                color: "808080",
                fill: "FFFFFF"
              });
              inc += 0.2;
            }
            if (result.data.address.email) {
              slide.addText(result.data.address.email, {
                x: "80%",
                y: y + inc,
                w: "2.0",
                h: 0.2,
                align: "left",
                font_size: 10,
                color: "808080",
                fill: "FFFFFF"
              });
              inc += 0.2;
            }
            if (result.data.address.telephone) {
              slide.addText(result.data.address.telephone, {
                x: "80%",
                y: y + inc,
                w: "2.0",
                h: 0.2,
                align: "left",
                font_size: 10,
                color: "808080",
                fill: "FFFFFF"
              });
              inc += 0.2;
            }

            if (
              result.data.profileImage &&
              result.data.profileImage[0] &&
              result.data.profileImage[0].cloudinaryId
            ) {
              toDataURL(
                result.data.profileImage,
                0,
                slide,
                pptx,
                "architect",
                function(response) {
                  if (response == "save") {
                    addBoardImages();
                  }
                }
              );
            } else {
              addBoardImages();
            }
          }
        } else {
          addBoardImages();
        }
      }
    );
    function addBoardImages() {
      var slide2 = pptx.addNewSlide();
      var count = 0;
      slide2.addText("IMAGES", {
        x: 0.6,
        y: "1%",
        w: "50%",
        h: 0.5,
        align: "left",
        font_size: 24,
        color: "808080",
        fill: "FFFFFF"
      });
      if (data.images && data.images.length > 0 && Array.isArray(data.images)) {
        slide.addText("Slide 1 of " + (Math.ceil(data.images.length / 2) + 1), {
          x: "80%",
          y: "90%",
          w: "2.0",
          h: 0.2,
          align: "left",
          font_size: 8,
          color: "808080",
          fill: "FFFFFF"
        });
        slide.addText(copyright, {
          x: 0.6,
          y: "90%",
          w: "2.0",
          h: 0.2,
          align: "left",
          font_size: 8,
          color: "808080",
          fill: "FFFFFF"
        });
        slide2.addText(
          "Slide 2 of " + (Math.ceil(data.images.length / 2) + 1),
          {
            x: "80%",
            y: "90%",
            w: "2.0",
            h: 0.2,
            align: "left",
            font_size: 8,
            color: "808080",
            fill: "FFFFFF"
          }
        );
        slide2.addText(copyright, {
          x: 0.6,
          y: "90%",
          w: "2.0",
          h: 0.2,
          align: "left",
          font_size: 8,
          color: "808080",
          fill: "FFFFFF"
        });
        toDataURL(data.images, count, slide2, pptx, undefined, function(
          result
        ) {
          if (result == "save") {
            pptx.save(data.name);
          }
        });
      } else {
        slide.addText("Slide 1 of 2", {
          x: "80%",
          y: "90%",
          w: "2.0",
          h: 0.2,
          align: "left",
          font_size: 8,
          color: "808080",
          fill: "FFFFFF"
        });
        slide.addText(copyright, {
          x: 0.6,
          y: "90%",
          w: "2.0",
          h: 0.2,
          align: "left",
          font_size: 8,
          color: "808080",
          fill: "FFFFFF"
        });
        slide2.addText("Slide 2 of 2", {
          x: "80%",
          y: "90%",
          w: "2.0",
          h: 0.2,
          align: "left",
          font_size: 8,
          color: "808080",
          fill: "FFFFFF"
        });
        slide2.addText(copyright, {
          x: 0.6,
          y: "90%",
          w: "2.0",
          h: 0.2,
          align: "left",
          font_size: 8,
          color: "808080",
          fill: "FFFFFF"
        });
        pptx.save(data.name);
      }
    }

    function toDataURL(
      images,
      count,
      slide,
      ppt,
      architect,
      callback,
      outputFormat
    ) {
      if (count < images.length) {
        var img = new Image();
        var src =
          "https://res.cloudinary.com/dzd0mlvkl/image/upload/v1623462816/" +
          images[count].cloudinaryId +
          ".jpg";
        img.crossOrigin = "Anonymous";
        img.onload = function() {
          var canvas = document.createElement("CANVAS");
          var ctx = canvas.getContext("2d");
          var dataURL;
          canvas.height = this.naturalHeight;
          canvas.width = this.naturalWidth;
          ctx.drawImage(this, 0, 0);
          dataURL = canvas.toDataURL(outputFormat);

          if (count != 0 && count % 2 == 0) {
            var temp = ppt.addNewSlide();
            temp.addText(
              "Slide " +
                (count / 2 + 2) +
                " of " +
                (Math.ceil(images.length / 2) + 1),
              {
                x: "80%",
                y: "90%",
                w: "2.0",
                h: 0.2,
                align: "left",
                font_size: 8,
                color: "808080",
                fill: "FFFFFF"
              }
            );
            temp.addText("IMAGES", {
              x: 0.6,
              y: "1%",
              w: "50%",
              h: 0.5,
              align: "left",
              font_size: 24,
              color: "808080",
              fill: "FFFFFF"
            });
            temp.addText(copyright, {
              x: 0.6,
              y: "90%",
              w: "2.0",
              h: 0.2,
              align: "left",
              font_size: 8,
              color: "808080",
              fill: "FFFFFF"
            });
            temp.addImage({
              data: dataURL,
              x: 0.6 + (count % 2) * 4.5,
              y: "15%",
              w: "42%",
              h: "60%"
            });
            toDataURL(
              images,
              count + 1,
              temp,
              ppt,
              architect,
              callback,
              outputFormat
            );
          } else {
            if (architect) {
              slide.addImage({
                data: dataURL,
                x: "81%",
                y: 0.1,
                w: "10%",
                h: "10%"
              });
            } else {
              slide.addImage({
                data: dataURL,
                x: 0.6 + (count % 2) * 4.5,
                y: "15%",
                w: "42%",
                h: "60%"
              });
            }
            toDataURL(
              images,
              count + 1,
              slide,
              ppt,
              architect,
              callback,
              outputFormat
            );
          }
        };
        img.onerror=function(){
        
          /*var canvas = document.createElement("CANVAS");
          var ctx = canvas.getContext("2d");
          var dataURL;
          canvas.height = this.naturalHeight;
          canvas.width = this.naturalWidth;
          ctx.drawImage(this, 0, 0);
          dataURL = canvas.toDataURL(outputFormat);*/

          if (count != 0 && count % 2 == 0) {
            var temp = ppt.addNewSlide();
            temp.addText(
              "Slide " +
                (count / 2 + 2) +
                " of " +
                (Math.ceil(images.length / 2) + 1),
              {
                x: "80%",
                y: "90%",
                w: "2.0",
                h: 0.2,
                align: "left",
                font_size: 8,
                color: "808080",
                fill: "FFFFFF"
              }
            );
            temp.addText("IMAGES", {
              x: 0.6,
              y: "1%",
              w: "50%",
              h: 0.5,
              align: "left",
              font_size: 24,
              color: "808080",
              fill: "FFFFFF"
            });
            temp.addText(copyright, {
              x: 0.6,
              y: "90%",
              w: "2.0",
              h: 0.2,
              align: "left",
              font_size: 8,
              color: "808080",
              fill: "FFFFFF"
            });
            /*temp.addImage({
              data: dataURL,
              x: 0.6 + (count % 2) * 4.5,
              y: "15%",
              w: "42%",
              h: "60%"
            });*/
            toDataURL(
              images,
              count + 1,
              temp,
              ppt,
              architect,
              callback,
              outputFormat
            );
          } else {
            if (architect) {
             /* slide.addImage({
                data: dataURL,
                x: "81%",
                y: 0.1,
                w: "10%",
                h: "10%"
              });*/
            } else {
              /*slide.addImage({
                data: dataURL,
                x: 0.6 + (count % 2) * 4.5,
                y: "15%",
                w: "42%",
                h: "60%"
              });*/
            }
            toDataURL(
              images,
              count + 1,
              slide,
              ppt,
              architect,
              callback,
              outputFormat
            );
          }
        }
        img.src = src;
        if (img.complete || img.complete === undefined) {
          img.src =
            "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
          img.src = src;
        }
      } else {
        if (callback && typeof callback == "function") {
          callback("save");
        }
      }
    }
  }
}
exports.exportPPT = exportPPT;
