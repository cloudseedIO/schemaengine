'use strict';

var React=require("react");
var ReactDOM = require("react-dom");
var Editor=require("draft-js").Editor;
var EditorState=require("draft-js").EditorState;
var RichUtils=require("draft-js").RichUtils;
var Modifier=require("draft-js").Modifier;
var CompositeDecorator=require("draft-js").CompositeDecorator;
//var ContentState=require("draft-js").ContentState;
var convertToRaw=require("draft-js").convertToRaw;
var convertFromRaw=require("draft-js").convertFromRaw;
var AtomicBlockUtils=require("draft-js").AtomicBlockUtils;
var Entity=require("draft-js").Entity;
var global = require("../../utils/global.js");


class MyEditor extends React.Component {
    constructor(props) {
   		const decorator = new CompositeDecorator([
        	{
              strategy: findLinkEntities,
              component: Link,
            },
      	]);
		super(props);
		var editorState= EditorState.createEmpty(decorator);
    	if(props.content){
    		try{
				editorState= EditorState.createWithContent(convertFromRaw(props.content),decorator);
			}catch(err){}
    	}
    	this.state = {
    		editorState: editorState,
    		showURLInput: false,
            urlValue: '',
            urlType: '',
            altValue:'',
            heightValue:'',
            widthValue:''
        };
    	this.focus = () => this.refs.editor.focus();
      	this.onChange = (editorState) => {
      		this.setState({editorState});
      		if(typeof props.callback=="function"){
      			props.callback(convertToRaw(this.state.editorState.getCurrentContent()));
      		}
      	};
      	this.logState = () => {
            console.log(convertToRaw(this.state.editorState.getCurrentContent()));
        };
      	this.handleKeyCommand = (command) => this._handleKeyCommand(command);
      	this.onTab = (e) => this._onTab(e);
      	this.toggleBlockType = (type) => this._toggleBlockType(type);
      	this.toggleInlineStyle = (style) => this._toggleInlineStyle(style);
      	this.toggleColor = (toggledColor) => this._toggleColor(toggledColor);
      	this.promptForLink = this._promptForLink.bind(this);
        this.onURLChange = (e) => this.setState({urlValue: e.target.value});
        this.onAltChange = (e) => this.setState({altValue: e.target.value});
        this.onHeightChange = (e) => this.setState({heightValue: e.target.value});
        this.onWidthChange = (e) => this.setState({widthValue: e.target.value});
        this.confirmMedia = this._confirmMedia.bind(this);
        this.onLinkInputKeyDown = this._onLinkInputKeyDown.bind(this);
        this.removeLink = this._removeLink.bind(this);

		this.addAudio = this._addAudio.bind(this);
        this.addImage = this._addImage.bind(this);
        this.addVideo = this._addVideo.bind(this);
 	}

	_handleKeyCommand(command) {
		const editorState = this.state.editorState;
    	const newState = RichUtils.handleKeyCommand(editorState, command);
    	if(newState){
      		this.onChange(newState);
        	return true;
     	}
     	return false;
    }

 	_onTab(e) {
      const maxDepth = 4;
      this.onChange(RichUtils.onTab(e, this.state.editorState, maxDepth));
    }

    _toggleBlockType(blockType) {
      this.onChange(
        RichUtils.toggleBlockType(
          this.state.editorState,
          blockType
        )
      );
    }

    _toggleInlineStyle(inlineStyle) {
      this.onChange(
        RichUtils.toggleInlineStyle(
          this.state.editorState,
          inlineStyle
        )
      );
    }

 	_toggleColor(toggledColor) {
    	const editorState = this.state.editorState;
        const selection = editorState.getSelection();
		// Let's just allow one color at a time. Turn off all active colors.
        const nextContentState = Object.keys(colorStyleMap)
          .reduce((contentState, color) => {
            return Modifier.removeInlineStyle(contentState, selection, color)
        }, editorState.getCurrentContent());
		let nextEditorState = EditorState.push(
        	editorState,
            nextContentState,
            'change-inline-style'
         );
		const currentStyle = editorState.getCurrentInlineStyle();
		// Unset style override for current color.
        if (selection.isCollapsed()) {
        	nextEditorState = currentStyle.reduce((state, color) => {
        		return RichUtils.toggleInlineStyle(state, color);
        	}, nextEditorState);
       	}
		// If the color is being toggled on, apply it.
        if (!currentStyle.has(toggledColor)) {
        	nextEditorState = RichUtils.toggleInlineStyle(
            	nextEditorState,
              	toggledColor
            );
      	}
		this.onChange(nextEditorState);
    }

    _promptForLink(e) {
    	e.preventDefault();
        const editorState = this.state.editorState;
        const selection = editorState.getSelection();
        if (!selection.isCollapsed()) {
          this.setState({
            showURLInput: true,
            urlValue: '',
            urlType:"url"
          }, () => {
            setTimeout(() => this.refs.url.focus(), 0);
          });
    	}
	}

	_confirmLink(e) {
          e.preventDefault();
          const editorState=this.state.editorState;
          const urlValue = this.state.urlValue;
          const altValue = this.state.altValue;
          const heightValue = this.state.heightValue;
          const widthValue = this.state.widthValue;
          const entityKey = Entity.create('LINK', 'MUTABLE', {url: urlValue,alt:altValue,height:heightValue,width:widthValue});
          this.setState({
            editorState: RichUtils.toggleLink(
              editorState,
              editorState.getSelection(),
              entityKey
            ),
            showURLInput: false,
            urlValue: '',
            altValue:'',
            heightValue:'',
            widthValue:''
          }, () => {
            setTimeout(() => this.refs.editor.focus(), 0);
          });
	}


	_confirmMedia(e) {
          e.preventDefault();
          const editorState = this.state.editorState;
          const urlValue = this.state.urlValue;
          const urlType = this.state.urlType;
          const altValue = this.state.altValue;
          const heightValue = this.state.heightValue;
          const widthValue = this.state.widthValue;
          const entityKey = Entity.create(urlType, 'IMMUTABLE', {src: urlValue,alt:altValue,height:heightValue,width:widthValue})
		  if(urlType=="url"){
          	this._confirmLink(e);
          	return;
          }
          this.setState({
            editorState: AtomicBlockUtils.insertAtomicBlock(
              editorState,
              entityKey,
              ' '
            ),
            showURLInput: false,
            urlValue: '',
            altValue:'',
            heightValue:'',
            widthValue:''
          }, () => {
            setTimeout(() => this.focus(), 0);
          });
        }




	_onLinkInputKeyDown(e) {
    	if (e.which === 13) {
            this._confirmLink(e);
    	}
	}

	_removeLink(e) {
    	e.preventDefault();
        const editorState = this.state.editorState;
        const selection = editorState.getSelection();
        if (!selection.isCollapsed()) {
	        this.setState({
	        	editorState: RichUtils.toggleLink(editorState, selection, null),
	       	});
        }
	}

   _promptForMedia(type) {
   		const editorState = this.state.editorState;
        this.setState({
        	showURLInput: true,
            urlValue: '',
            urlType: type,
            altValue:'',
            height:'',
            width:''
          }, () => {
            setTimeout(() => this.refs.url.focus(), 0);
          });
	}

	_addAudio() {
         this._promptForMedia('audio');
    }

    _addImage() {
    	this._promptForMedia('image');
    }

    _addVideo() {
    	this._promptForMedia('video');
    }

    render() {
		const editorState = this.state.editorState;
		// If the user changes block type before entering any text, we can
		// either style the placeholder or hide it. Let's just hide it now.
  		let className = 'RichEditor-editor';
  		var contentState = editorState.getCurrentContent();
  		if (!contentState.hasText()) {
    		if (contentState.getBlockMap().first().getType() !== 'unstyled') {
      			className += ' RichEditor-hidePlaceholder';
    		}
  		}

		let urlInput;
        if (this.state.showURLInput) {
            urlInput =
              <div>
                <input
                  onChange={this.onURLChange}
                  type="text"
                  placeholder="url"
                  value={this.state.urlValue}
                  onKeyDown={this.onLinkInputKeyDown}
                />
                 <input
                  onChange={this.onAltChange}
                  type="text"
                  placeholder="Alt text"
                  value={this.state.altValue}
                />
                 <input
                  onChange={this.onHeightChange}
                  type="text"
                  placeholder="height"
                  value={this.state.heightValue}
                />
                 <input
                  onChange={this.onWidthChange}
                  type="text"
                  placeholder="width"
                  value={this.state.widthValue}
                />
                <button onMouseDown={this.confirmMedia}>
                  Confirm
                </button>
              </div>;
        }

		var mode="create";
		var editorStyle={};
		if(this.props.mode){
			mode=this.props.mode;
			if(mode!="view"){
				editorStyle={border:"1px solid grey"};
			}
		}
		var controls="";
		if(mode!="view"){
			controls=<div>
		    	<BlockStyleControls
		        	editorState={editorState}
		        	onToggle={this.toggleBlockType}/>
		      	<InlineStyleControls
		        	editorState={editorState}
		        	onToggle={this.toggleInlineStyle}/>
		       	<ColorControls
		        	editorState={editorState}
		         	onToggle={this.toggleColor}/>
				<div>
	        		<div className="btn display-inline extra padding-right" onMouseDown={this.promptForLink}>Add Link</div>
	          		<div className="btn display-inline extra padding-right" onMouseDown={this.removeLink}>Remove Link</div>
	        		<div className="btn display-inline extra padding-right" onMouseDown={this.addAudio}>Add Audio</div>
	        		<div className="btn display-inline extra padding-right" onMouseDown={this.addImage}>Add Image</div>
	        		<div className="btn display-inline extra padding-right" onMouseDown={this.addVideo}>Add Video</div>
	       		</div>
	       		{urlInput}
       		</div>
       	}
	  return (
	  	<div className="RichEditor-root">
	  		{controls}
	     	<div className={className} onClick={mode=="view"?(function(){}):this.focus} style={editorStyle}>
	       		<Editor
	       			blockRendererFn={mediaBlockRenderer}
	         		blockStyleFn={getBlockStyle}
	          		customStyleMap={colorStyleMap}
	          		editorState={editorState}
	          		handleKeyCommand={this.handleKeyCommand}
	          		onChange={this.onChange}
	          		onTab={this.onTab}
	          		ref="editor"
	          		readOnly={mode=="view"?true:false}
	          		spellCheck={true}/>
	        </div>
	      </div>
	      );
	}
}
exports.MyEditor=MyEditor;
// Custom overrides for "code" style.
const styleMap = {
	CODE: {
		backgroundColor: 'rgba(0, 0, 0, 0.05)',
  		fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    	fontSize: 16,
      	padding: 2,
    },
};
function getBlockStyle(block) {
	switch (block.getType()) {
    	case 'blockquote': return 'RichEditor-blockquote';
      	default: return null;
	}
}

class StyleButton extends React.Component {
    constructor() {
      	super();
      	this.onToggle = (e) => {
       		e.preventDefault();
        	this.props.onToggle(this.props.style);
     	};
    }
    render() {
      	/*let className = 'RichEditor-styleButton';if (this.props.active) {className += ' RichEditor-activeButton';}
		return (<span className={className} onMouseDown={this.onToggle}>{this.props.label}</span>);*/
      	let className = 'btn display-inline extra padding-right';
      	if(this.props.active){
      		className +=' btn-warning';
      	}
      	return <div title={this.props.label} onMouseDown={this.onToggle} className={className}>{this.props.label}</div>
    }
}

const BLOCK_TYPES = [
    {label: 'H1', style: 'header-one'},
	{label: 'H2', style: 'header-two'},
	{label: 'H3', style: 'header-three'},
	{label: 'H4', style: 'header-four'},
	{label: 'H5', style: 'header-five'},
	{label: 'H6', style: 'header-six'},
	{label: 'Blockquote', style: 'blockquote'},
	{label: 'UL', style: 'unordered-list-item'},
	{label: 'OL', style: 'ordered-list-item'},
	{label: 'Code Block', style: 'code-block'}
];

const BlockStyleControls = (props) => {
	const editorState = props.editorState;
    const selection = editorState.getSelection();
    const blockType = editorState
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey())
      .getType();

    return (
      <div className="RichEditor-controls">
        {BLOCK_TYPES.map((type) =>
          <StyleButton
            key={type.label}
            active={type.style === blockType}
            label={type.label}
            onToggle={props.onToggle}
            style={type.style}
          />
        )}
      </div>
    );
  };

var INLINE_STYLES = [
	{label: 'Bold', style: 'BOLD'},
	{label: 'Italic', style: 'ITALIC'},
	{label: 'Underline', style: 'UNDERLINE'},
	{label: 'Monospace', style: 'CODE'},
];

const InlineStyleControls = (props) => {
	var currentStyle = props.editorState.getCurrentInlineStyle();
    return (
      <div className="RichEditor-controls">
        {INLINE_STYLES.map(type =>
          <StyleButton
            key={type.label}
            active={currentStyle.has(type.style)}
            label={type.label}
            onToggle={props.onToggle}
            style={type.style}
          />
        )}
      </div>
    );
};
var COLORS = [
        {label: 'Red', style: 'red'},
        {label: 'Orange', style: 'orange'},
        {label: 'Yellow', style: 'yellow'},
        {label: 'Green', style: 'green'},
        {label: 'Blue', style: 'blue'},
        {label: 'Indigo', style: 'indigo'},
        {label: 'Violet', style: 'violet'},
        {label: 'Gray', style: 'gray'},
        {label: 'LightGray', style: 'lightgray'},
      ];
const colorStyleMap = {
    red: {
      color: 'rgba(255, 0, 0, 1.0)',
    },
    orange: {
      color: 'rgba(255, 127, 0, 1.0)',
    },
    yellow: {
      color: 'rgba(180, 180, 0, 1.0)',
    },
    green: {
      color: 'rgba(0, 180, 0, 1.0)',
    },
    blue: {
      color: 'rgba(0, 0, 255, 1.0)',
    },
    indigo: {
      color: 'rgba(75, 0, 130, 1.0)',
    },
    violet: {
      color: 'rgba(127, 0, 255, 1.0)',
    },
    gray: {
      color: 'rgba(128, 128, 128, 1.0)',
    },
    lightgray: {
      color: 'rgba(128, 128, 128, 0.5)',
    },
};
const ColorControls = (props) => {
    var currentStyle = props.editorState.getCurrentInlineStyle();
    return (
      <div className="RichEditor-controls">
        {COLORS.map(type =>
          <StyleButton
            key={global.guid()}
            active={currentStyle.has(type.style)}
            label={type.label}
            onToggle={props.onToggle}
            style={type.style}
          />
        )}
      </div>
    );
};



function findLinkEntities(contentBlock, callback) {
	contentBlock.findEntityRanges(
    	(character) => {
        	const entityKey = character.getEntity();
            return (
            	entityKey !== null &&
             	Entity.get(entityKey).getType() === 'LINK'
          	);
		},
        callback
	);
}

const Link = (props) => {
	const url = Entity.get(props.entityKey).getData().url;
    return (
    	<a href={url}>
            {props.children}
        </a>
    );
};




function mediaBlockRenderer(block) {
	if (block.getType() === 'atomic') {
     return {
        component: Media,
        editable: false,
      };
    }

    return null;
  }

const Audio = (props) => {
   return <audio controls src={props.src}/>;
};

const Image = (props) => {
   return <img src={props.src} alt={props.alt} height={props.height} width={props.width}/>;
};

const Video = (props) => {
   return <video controls src={props.src}/>;
};

const Media = (props) => {
	const entity = Entity.get(props.block.getEntityAt(0));
    const src = entity.getData().src;
    const type = entity.getType();

    let media;
    if (type === 'audio') {
      media = <Audio src={src} alt={entity.getData().alt} height={entity.getData().height} width={entity.getData().width}/>;
    } else if (type === 'image') {
      media = <Image src={src} alt={entity.getData().alt} height={entity.getData().height} width={entity.getData().width}/>;
    } else if (type === 'video') {
      media = <Video src={src} alt={entity.getData().alt} height={entity.getData().height} width={entity.getData().width}/>;
    }

    return media;
};





function createRTE(){
	ReactDOM.render(
	  <MyEditor />,
	  document.getElementById('dynamicContentDiv')
	);
}
if(typeof window!="undefined"){
	window.createRTE=createRTE;
}
