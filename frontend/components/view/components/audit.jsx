/**
 * @author - Vikram
 */
var React = require("react");
//var ReactDOM = require('react-dom');
var common = require("../../common.jsx");
var getContent = require("./getContent.jsx");
var global = require("../../../utils/global.js");
var WebUtils = require("../../../utils/WebAPIUtils.js");
var SchemaStore = require("../../../stores/SchemaStore.js");
var linkGenerator = require("../../nav/linkGenerator.jsx");
var Link = require("react-router").Link;
var limitCount = global.auditLimitCount;
/**
 * rootSchema, dependentSchema, schemaDoc, recordId, org, rootRecord
 */

var Audit = React.createClass({
  getInitialState: function() {
    return { audits: [], skip: 0, total: 0 };
  },
  increaseSkipCount: function() {
    var self = this;
    this.setState({ skip: self.state.skip + limitCount }, self.getAudits);
  },
  reduceSkipCount: function() {
    var self = this;
    this.setState({ skip: self.state.skip - limitCount }, self.getAudits);
  },
  pageSelected: function() {
    var self = this;
    this.setState(
      { skip: self["pageSelect"].value * limitCount },
      self.getAudits
    );
  },
  componentDidMount: function() {
    this.getTotalAudits(this.getAudits);
  },
  componentWillUnmount: function() {
    this._isUnmounted = true;
  },
  getTotalAudits: function(callback) {
    WebUtils.getTotalAudits(
      { recordId: this.props.recordId },
      function(recs) {
        if (!this._isUnmounted)
          this.setState({ total: recs.total }, function() {
            if (typeof callback == "function") {
              callback();
            }
          });
      }.bind(this)
    );
  },
  getAudits: function() {
    WebUtils.getAudits(
      { recordId: this.props.recordId, skip: this.state.skip },
      function(recs) {
        if (Array.isArray(recs)) {
          if (!this._isUnmounted) this.setState({ audits: recs });
        }
      }.bind(this)
    );
  },
  render: function() {
    var self = this;
    var blobData = [
      "video",
      "image",
      "images",
      "attachment",
      "attachments",
      "privateVideo",
      "privateVideos",
      "geoLocation"
    ];
    return (
      <div className="auditContent col-lg-12 col-md-12 col-sm-12 col-xs-12">
        {this.state.audits.map(function(audit, index) {
          audit = audit.audit;
          var schemaDoc = SchemaStore.get(audit.schema);
          var schemaDisplayName =
            schemaDoc["@displayName"] || schemaDoc["displayName"];
          schemaDisplayName = schemaDisplayName ? schemaDisplayName : "";
          var url = linkGenerator.getDetailLink({
            org: self.props.org,
            schema: audit.schema,
            recordId: audit.recordId
          });
          schemaDisplayName = schemaDisplayName.replace(/s$/, "");
          if (schemaDoc["@name"] && schemaDoc["@name"].singular) {
            schemaDisplayName = schemaDoc["@name"].singular;
          }
          if (audit.type == "create" || audit.type == "delete") {
            try {
              return (
                <div key={global.guid()} className="auditRow">
                  <div className="auditNumber display-table-cell hidden">
                    {index + 1 + ". "}
                  </div>
                  <div className="display-table-cell">
                    <span className="auditDate">
                      {global.getLocaleDateString(audit.dateModified)}
                    </span>&nbsp;
                    <span className="auditActor">
                      <common.UserIcon
                        onlyName={true}
                        rootSchema={"User"}
                        id={audit.editor}
                        org={self.props.org}
                      />
                    </span>
                    <span className="auditAction">
                      {audit.type == "create" ? " Created " : " Deleted "}
                    </span>
                    <span className="auditSchema">
                      {schemaDisplayName + " "}
                    </span>
                    <span className="auditRecordHeading">
                      <Link to={url}>{audit.heading}</Link>
                    </span>
                  </div>
                </div>
              );
            } catch (err) {
              return <div key={global.guid()} />;
            }
          } else if (Array.isArray(audit.update) && audit.update.length > 0) {
            return audit.update.map(function(update, innerIndex) {
              try {
                var prev = {};
                var curr = {};
                prev[update.key] = update.prev;
                curr[update.key] = update.curr;
                var dataType =
                  schemaDoc["@properties"] &&
                  schemaDoc["@properties"][update.key] &&
                  schemaDoc["@properties"][update.key].dataType &&
                  schemaDoc["@properties"][update.key].dataType.type
                    ? schemaDoc["@properties"][update.key].dataType.type
                    : undefined;
                if (dataType == "array") {
                  if (
                    schemaDoc["@properties"][update.key].dataType &&
                    schemaDoc["@properties"][update.key].dataType.elements &&
                    schemaDoc["@properties"][update.key].dataType.elements.type
                  )
                    dataType =
                      schemaDoc["@properties"][update.key].dataType.elements
                        .type;
                }
                return (
                  <div key={global.guid()} className="auditRow">
                    <div className="auditNumber display-table-cell hidden">
                      {index +
                        1 +
                        (innerIndex > 0 ? "." + (innerIndex + 1) : "") +
                        ". "}
                    </div>
                    <div className="display-table-cell">
                      <span className="auditDate">
                        {global.getLocaleDateString(audit.dateModified)}
                      </span>&nbsp;
                      <span className="auditActor">
                        <common.UserIcon
                          onlyName={true}
                          rootSchema={"User"}
                          id={audit.editor}
                          org={self.props.org}
                        />
                      </span>
                      <span className="auditAction">{" Updated "}</span>
                      <span className="auditSchema">
                        {schemaDisplayName + " "}
                      </span>
                      <span className="auditRecordHeading">
                        <Link to={url}>{audit.heading + " "}</Link>
                      </span>
                      <span className="auditRecordProperty">
                        {update.key == "$status"
                          ? "Status "
                          : schemaDoc["@properties"][update.key].displayName +
                            " "}
                      </span>
                      {blobData.indexOf(dataType) != -1 ? (
                        !update.prev ||
                        (update.prev && update.prev.length == 0) ? (
                          <span className="auditUpdate">
                            <getContent.GetContent
                              displayName="No"
                              rootSchema={audit.schema}
                              property={update.key}
                              divType={""}
                              noFormGroup={"yes"}
                              fullRecord={curr}
                              audit={true}
                              auditMessage={"Created"}
                              recordId={audit.recordId}
                              org={self.props.org}
                            />
                          </span>
                        ) : !update.curr ||
                        (update.curr && update.curr.length == 0) ? (
                          <span className="auditUpdate">
                            <getContent.GetContent
                              displayName="No"
                              rootSchema={audit.schema}
                              property={update.key}
                              divType={""}
                              noFormGroup={"yes"}
                              fullRecord={prev}
                              audit={true}
                              auditMessage={"Deleted"}
                              recordId={audit.recordId}
                              org={self.props.org}
                            />
                          </span>
                        ) : (
                          <span className="auditUpdate">
                            <getContent.GetContent
                              displayName="No"
                              rootSchema={audit.schema}
                              property={update.key}
                              divType={""}
                              noFormGroup={"yes"}
                              fullRecord={curr}
                              audit={true}
                              auditMessage={"Modified"}
                              recordId={audit.recordId}
                              org={self.props.org}
                            />
                          </span>
                        )
                      ) : (
                        <span>
                          <span className="auditUpdateFrom">
                            {!update.prev ||
                            (update.prev && update.prev.length == 0) ? (
                              " <Empty> "
                            ) : (
                              <getContent.GetContent
                                displayName="No"
                                rootSchema={audit.schema}
                                property={update.key}
                                divType={""}
                                noFormGroup={"yes"}
                                fullRecord={prev}
                                audit={true}
                                recordId={audit.recordId}
                                org={self.props.org}
                              />
                            )}
                          </span>&nbsp;
                          <span className="auditUpdateTo">
                            {!update.curr ||
                            (update.curr && update.curr.length == 0) ? (
                              " <Empty> "
                            ) : (
                              <getContent.GetContent
                                displayName="No"
                                rootSchema={audit.schema}
                                divType={""}
                                noFormGroup={"yes"}
                                property={update.key}
                                fullRecord={curr}
                                audit={true}
                                recordId={audit.recordId}
                                org={self.props.org}
                              />
                            )}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              } catch (err) {
                return <div key={global.guid()} />;
              }
            });
          }
        })}

        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding  remove-margin-top">
          <div className="pull-right">
            {self.state.skip && self.state.skip >= limitCount ? (
              <div
                className="link display-table-cell extra-padding-right "
                onClick={self.reduceSkipCount}
              >
                <div className="child-img-component no-padding">
                  <i className="sleekIcon-leftarrow fa-2x nextPrevIcons" />
                </div>
                <div className="child-img-component no-padding">
                  <span className="nextPrevIcons">PREV</span>
                </div>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </div>
            ) : (
              <span />
            )}
            {self.state.total > limitCount ? (
              <div className="link display-table-cell extra-padding-right vertical-align-top">
                <select
                  className="form-control"
                  ref={select => {
                    self["pageSelect"] = select;
                  }}
                  onChange={self.pageSelected}
                  defaultValue={Math.floor(
                    (self.state.skip ? self.state.skip : 0) / limitCount
                  )}
                  key={global.guid()}
                >
                  <option value={0}>1</option>
                  {[1].map(function() {
                    var options = [];
                    for (var si = 1; si < self.state.total / limitCount; si++) {
                      options.push(
                        <option key={global.guid()} value={si * 1}>
                          {si + 1}
                        </option>
                      );
                    }
                    return options;
                  })}
                </select>
              </div>
            ) : (
              <span className="hidden" />
            )}
            {self.state.total >
            limitCount + (self.state.skip ? self.state.skip : 0) ? (
              <div
                className="link display-table-cell"
                onClick={self.increaseSkipCount}
              >
                <div className="child-img-component no-padding">
                  <span className="nextPrevIcons">NEXT</span>
                </div>
                <div className="child-img-component no-padding">
                  <i className="sleekIcon-rightarrow fa-2x nextPrevIcons " />
                </div>
              </div>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>
    );
  }
}); /*
var Audit2=React.createClass({
	render:function(){
		var self=this;
		if(Array.isArray(this.props.rootRecord["@audit"]) && this.props.rootRecord["@audit"].length>0){
		return (<div className="table-responsive col-lg-12 col-md-12 col-sm-12 col-xs-12">
				<table className="table table-striped table-hover">
					<thead>
						<tr>
							<th rowSpan="2">User</th>
							<th rowSpan="2">Date</th>
							<th colSpan="3">Modification</th>
						</tr>
						<tr>
							<th>Changed</th>
							<th>From</th>
							<th>To</th>
						</tr>
					</thead>
					<tbody>
					{
						this.props.rootRecord["@audit"].map(function(audit){
							if(Array.isArray(audit.update) && audit.update.length>0){
								return audit.update.map(function(update,index){
									try{
										var cols=[];
										if(index==0){
											cols.push(<td key={global.guid()} rowSpan={audit.update.length}><common.UserIcon rootSchema={"User"} id={audit.editor} org={self.props.org}/></td>);
											cols.push(<td key={global.guid()} rowSpan={audit.update.length}>{audit.dateModified}</td>);
										}
										cols.push(<td key={global.guid()}>{(update.key=="$status")?"Status":(self.props.schemaDoc["@properties"][update.key].displayName)}</td>);
										//cols.push(<td>{update.prev}</td>);
										//cols.push(<td>{update.curr}</td>);
										var prev={};
										var curr={};
										prev[update.key]=update.prev;
										curr[update.key]=update.curr;
										cols.push(<td key={global.guid()}><getContent.GetContent
														displayName="No"
														fullLayout={self.props.fullLayout}
														dependentSchema={self.props.dependentSchema}
														rootSchema={self.props.rootSchema}
														schemaDoc={self.props.schemaDoc}
														property={update.key}
														fullRecord={prev}
														recordId={self.props.recordId}
														org={self.props.org}/></td>);
										cols.push(<td key={global.guid()}><getContent.GetContent
														displayName="No"
														fullLayout={self.props.fullLayout}
														dependentSchema={self.props.dependentSchema}
														rootSchema={self.props.rootSchema}
														schemaDoc={self.props.schemaDoc}
														property={update.key}
														fullRecord={curr}
														recordId={self.props.recordId}
														org={self.props.org}/></td>)
										return (<tr key={global.guid()} key={global.guid()}>{cols}</tr>)
									}catch(err){
										return <tr key={global.guid()}></tr>
									}
								})
							}
						})
					}
					</tbody>
				</table>
				</div>)
		}else{
			return <div className="hidden"></div>
		}
	}
});*/
/*
var Audit1=React.createClass({
	getInitialState:function(){
		return {audits:[]};
	},
	componentDidMount:function(){
		var self=this;
		WebUtils.getAudits({recordId:this.props.recordId},function(recs){
			if(Arrya.isArray(recs)){
				if(!self._isUnmounted)
				self.setState({audits:recs});
			}else{

			}
		});
	},
	componentWillUnmount:function(){
		this._isUnmounted=true;
	},
	render:function(){
		var self=this;
		return (<div className="table-responsive col-lg-12 col-md-12 col-sm-12 col-xs-12">
				<table className="table table-striped table-hover">
					<thead>
						<tr>
							<th rowSpan="2">User</th>
							<th rowSpan="2">Date</th>
							<th colSpan="3">Modification</th>
						</tr>
						<tr>
							<th>Changed</th>
							<th>From</th>
							<th>To</th>
						</tr>
					</thead>
					<tbody>
					{
						this.state.audits.map(function(audit){
							audit=audit.audit;
							if(audit.type=="create"){
								try{
									return (<tr key={global.guid()}>
												<td>
													<common.UserIcon
															rootSchema={"User"}
															id={audit.editor}
															org={self.props.org}/>
												</td>
												<td>{audit.dateModified}</td>
												<td>
													{SchemaStore.get(audit.schema)["@displayName"] || SchemaStore.get(audit.schema)["displayName"]}
												</td>
												<td>
													{audit.heading}
												</td>
												<td>{"Created"}</td>
											</tr>);
								}catch(err){
									return <tr key={global.guid()}></tr>
								}
							}else if(audit.type=="delete"){
								try{
									return (<tr key={global.guid()}>
												<td>
													<common.UserIcon
															rootSchema={"User"}
															id={audit.editor}
															org={self.props.org}/>
												</td>
												<td>{audit.dateModified}</td>
												<td>
													{SchemaStore.get(audit.schema)["@displayName"] || SchemaStore.get(audit.schema)["displayName"]}
												</td>
												<td>
													{audit.heading}
												</td>
												<td>{"Deleted"}</td>
											</tr>);
								}catch(err){
									return <tr key={global.guid()}></tr>
								}
							}else if(Array.isArray(audit.update) && audit.update.length>0){
								return audit.update.map(function(update,index){
									try{
										var cols=[];
										if(index==0){
											cols.push(<td key={global.guid()} rowSpan={audit.update.length}><common.UserIcon rootSchema={"User"} id={audit.editor} org={self.props.org}/></td>);
											cols.push(<td key={global.guid()} rowSpan={audit.update.length}>{audit.dateModified}</td>);
										}
										var changingParty="";
										if(self.props.recordId!=audit.recordId){
											changingParty=(SchemaStore.get(audit.schema)["@displayName"] || SchemaStore.get(audit.schema)["displayName"]);
											changingParty+= " -> "+ audit.heading+" :"
										}
										cols.push(<td key={global.guid()}>{changingParty+((update.key=="$status")?"Status":(self.props.schemaDoc["@properties"][update.key].displayName))}</td>);
										var prev={};
										var curr={};
										prev[update.key]=update.prev;
										curr[update.key]=update.curr;
										cols.push(<td key={global.guid()}>
													<getContent.GetContent
														displayName="No"
														rootSchema={audit.schema}
														property={update.key}
														fullRecord={prev}
														recordId={audit.recordId}
														org={self.props.org}/></td>);
										cols.push(<td key={global.guid()}>
													<getContent.GetContent
														displayName="No"
														rootSchema={audit.schema}
														property={update.key}
														fullRecord={curr}
														recordId={audit.recordId}
														org={self.props.org}/></td>)
										return (<tr key={global.guid()} key={global.guid()}>{cols}</tr>)
									}catch(err){
										return <tr key={global.guid()}></tr>
									}
								})
							}
						})
					}
					</tbody>
				</table>
				</div>);
	}
});
*/ exports.Audit = Audit;
