var mcons=null;
var globalContext=null;
var inputHistory={
	inputs: [], current: 0, cache: null,
	push: function(code) { this.inputs.push(code); this.current=this.inputs.length; },
	pushCache: function(code) { this.cache=code; },
	back: function()
	{
		if(this.current==0) return null;
		return this.inputs[--this.current];
	},
	forward: function()
	{
		if(this.current==this.inputs.length)
		{
			return null;
		}
		if(this.current==this.inputs.length-1)
		{
			++this.current;
			return null;
		}
		return this.inputs[++this.current];
	},
	isAtEnd: function() { return this.current==this.inputs.length; }
};

window.addEventListener('load', function()
{
	window.state = {
		dragging: false
	};
	window.elements = {
		dragger: document.getElementById('dragger'),
		topPanel: document.getElementById('output-container'),
		bottomPanel: document.getElementById('input'),
		text: document.getElementById('command'),
		output: document.getElementById('output'),
		outputScroller: document.getElementById('output-clone'),
		tabs: {
			console: [document.getElementById('console-head'), document.getElementById('console-body')],
			modules: [document.getElementById('modules-head'), document.getElementById('modules-body')],
			code: [document.getElementById('code-head'), document.getElementById('code-body')]
		}
	};

	// tabs switching
	Object.getOwnPropertyNames(window.elements.tabs).forEach(function(item, i, arr)
	{
		window.elements.tabs[item][0].addEventListener('click',function()
		{
			arr.forEach(function(item)
			{
				window.elements.tabs[item][0].classList.remove('active');
				window.elements.tabs[item][1].classList.remove('active');
			});
			window.elements.tabs[item][0].classList.add('active');
			window.elements.tabs[item][1].classList.add('active');
		});
	});

	window.elements.text.addEventListener('keypress', function(ev)
	{
		if(ev.keyCode == 13 && !(ev.shiftKey || ev.ctrlKey || ev.altKey))
		{
			var code = this.value;
			inputHistory.push(code);

			var codeText=code.replace(/\n/g, '<br />').replace(/  /g, '&nbsp ').replace(/\t/g, '&nbsp&nbsp&nbsp ');
			addMessage(createMessage({type: 'input', text: codeText}));

			var result;
			try
			{
				result=execute(code, globalContext);
				mcons.print(result);
				result=null;
			}
			catch(ex)
			{
				mcons.error(ex);
			}
			this.value='';

			ev.preventDefault();
			return false;
		}
		if(ev.keyCode == 38 && ev.ctrlKey)
		{
			// up in history
			if(inputHistory.isAtEnd()) inputHistory.pushCache(this.value);
			var b=inputHistory.back();
			if(b!==null) this.value=b;
		}
		if(ev.keyCode == 40 && ev.ctrlKey)
		{
			// down in history
			var f=inputHistory.forward();
			if(f===null) this.value=inputHistory.cache;
			else this.value=f;
		}
	});

	function execute(code, context)
	{
		/*code=code.replace(/["\\]/g, '\\$1')
			.replace(/('.*?[^\\])(\\\n)(.*?)'/g, '$1$3')
			.replace()
			.replace();*/
		var props = Object.getOwnPropertyNames(context);
		var values = props.map(function(item){ return context[item]; });

		props.push('_executee');
		values.push(code);

		var point = 'return eval(_executee);';
		return (new Function(props.join(','), point)).apply({}, values);
	}

	function createMessage(params)
	{
		params.__proto__={
			type: 'string',
			text: '',
			// mb: moreValues: [],
			input: null,
			typename: ''
		};

		var div=document.createElement('div');
		var dt=new Date();
		div.classList.add('item');
		div.classList.add(params.type);

		var inner=document.createElement('div');
		inner.classList.add('time');
		inner.innerHTML=dt.toLocaleTimeString();
		div.appendChild(inner);

		inner=document.createElement('div');
		inner.classList.add('date');
		var m=dt.getMonth()+1;
		if(m<10) m='0'+m;
		inner.innerHTML=dt.getDate()+'.'+m;
		div.appendChild(inner);

		inner=document.createElement('div');
		inner.classList.add('type');
		inner.innerHTML=params.typename;
		div.appendChild(inner);

		if(params.input!=null)
		{
			inner=document.createElement('div');
			inner.classList.add('content');
			inner.classList.add('input');
			inner.innerHTML=params.input;
			div.appendChild(inner);
		}

		inner=document.createElement('div');
		inner.classList.add('content');
		inner.classList.add(params.type);

		try
		{
			inner.appendChild(params.text);
		}
		catch(ex)
		{
			inner.innerHTML=params.text+'';
		}

		div.appendChild(inner);
		return div;
	}

	function addMessage(msg)
	{
		window.elements.output.appendChild(msg);
		var o=window.elements.outputScroller;
		o.scrollTo(0, o.scrollHeight-o.clientHeight);
	}

	mcons={
		print: function(obj)
		{
			if(arguments.length==0) return;

			({
				// TODO: clean up all the cases except 'object' (they're minded in formOutput)
				'string': function(str)
				{
					addMessage(createMessage({type: 'string', text: fmt.whitespaces(str), typename: 'String'}))
				},
				'number': function(n)
				{
					addMessage(createMessage({type: 'number', text: n, typename: 'Number'}))
				},
				'object': function(obj)
				{
					addMessage(createMessage({type: 'object', text: formOutput(obj).render(),
											 typename: getTypename(obj)}));
				},
				'undefined': function()
				{
					addMessage(createMessage({type: 'object', text: '(undefined)'}))
				},
				'boolean': function(b)
				{
					addMessage(createMessage({type: 'bool', text: b, typename: 'Boolean'}))
				},
				'function': function(f)
				{
					addMessage(createMessage({type: 'code', text: formOutput(f).render(), typename: 'Function'}))
				}
			})[typeof obj](obj);
		},
		error: function(msg)
		{
			addMessage(createMessage({type: 'error', text: msg}))
		},
		warning: function(msg)
		{
			addMessage(createMessage({type: 'warning', text: msg}))
		},
		clear: function()
		{
			window.elements.output.innerHTML='';
		}
	};

	globalContext={
		print: mcons.print,
		warn: mcons.warning,
		error: mcons.error,
		help: 	'This is simple JS console with some built-in math libraries and functions.\n' +
				'Hotkeys: Enter runs the script, Ctrl|Shift|Alt+Enter breaks the line, ' +
				'Ctrl+Up and Ctrl+Down navigates you through input history.\n' +
				'Use lookAround() to list all properties in the context.\n' +
				'Also, all global variables are visible for this console.',
		lookAround: (function()
		{
			var props=Object.getOwnPropertyNames(this);
			return 'Available items:\n'+props.map(function(item)
			{
			  return item+': '+typeof this[item];
			}, this).join('\n');
		})//.bind(globalContext)
	};
	globalContext.lookAround=globalContext.lookAround.bind(globalContext);
});

function getTypename(obj)
{
	if(typeof obj.typename == typeof '') return obj.typename;
	var str=({}).toString.call(obj);
	return str.substring(8, str.length-1);
}

function formOutput(obj)
{
	var f=({
		'object': function(obj)
		{
			if(obj==null)
			{
				return new FormattedText().bold("null");
			}
			if(typeof obj.render == typeof eval) return obj;

			var output=new FormattedText();
			if(Array.isArray(obj))
			{
				output.plain('[');
				for(var i=0; i<obj.length; i++)
				{
					if(i==obj.length-1) output.startIndent();
					else output.startList();
					output.push(formOutput(obj[i]));
					output.endBlock();
				}
				output.plain(']');
				return output;
			}

			output.plain('{');
			Object.getOwnPropertyNames(obj).forEach(function(item, i, arr)
			{
				if(i==arr.length-1) output.startIndent();
				else output.startList();

				output.plain(item+': ');
				output.push(formOutput(obj[item]));

				output.endBlock();
			});
			output.plain('}')

			return output;
		},
		'string': function(str)
		{
			return new FormattedText().string('"'+str+'"');
		},
		'number': function(n)
		{
			return new FormattedText().number(n+'');
		},
		'undefined': function()
		{
			return new FormattedText().plain('(undefined)');
		},
		'boolean': function(b)
		{
			return new FormattedText().bool(b+'');
		},
		'function': function(f)
		{
			var code=fmt.escape(f+'');
			var keywords=['class',
				'function', 'this', 'new',
				'return',
				'if', 'for', 'while', 'do', 'else',
				'switch'
			];
			keywords.forEach(function(item)
			{
				code=code.replace(new RegExp('([^A-z0-9_$]|^)('+item+')([^A-z0-9_$]|$)', 'g'),
								  '$1<span class="keyword1">$2</span>$3');
			});
			keywords=['null',
				'break', 'continue',
				'try', 'catch', 'finally',
				'case', 'default', 'typeof', 'in',
				'extends',
				'\\[native code\\]'
			];

			keywords.forEach(function(item)
			{
				code=code.replace(new RegExp('([^A-z0-9_$]|^)('+item+')([^A-z0-9_$]|$)', 'g'),
								  '$1<span class="keyword2">$2</span>$3');
			});

			keywords=['var', 'let', 'const', 'false', 'true'];
			keywords.forEach(function(item)
			{
				code=code.replace(new RegExp('([^A-z0-9_$]|^)('+item+')([^A-z0-9_$]|$)', 'g'),
								  '$1<span class="keyword3">$2</span>$3');
			});
			console.log(code);
			return new FormattedText().html(fmt.whitespaces(code));
		}
	})[typeof obj];
	return (f || function(obj)
	{
		//default
		return obj;
	})(obj);
}
