var fmt={};

fmt.tag=function(name, content, classes)
{
	var el=document.createElement(name);
	if(typeof content == typeof '') el.innerHTML=content;
	else if(Array.isArray(content)) content.forEach(function(item)
	{
		el.appendChild(item);
 	});
	else el.appendChild(content);

	if(Array.isArray(classes)) classes.forEach(function(item)
	{
		el.classList.add(item);
	});
	return el;
};

fmt.bold=function(c)		{ return fmt.tag('b', c); };
fmt.italic=function(c)		{ return fmt.tag('i', c); };
fmt.underlined=function(c)	{ return fmt.tag('u', c); };
fmt.stroked=function(c)		{ return fmt.tag('s', c); };
fmt.string=function(c)		{ return fmt.tag('span', c, ['string']); };
fmt.number=function(c)		{ return fmt.tag('span', c, ['number']); };
fmt.bool=function(c)		{ return fmt.tag('span', c, ['bool']); };

fmt.div=function(content, classes)		{ return fmt.tag('div', content, classes); };
fmt.span=function(content, classes)		{ return fmt.tag('span', content, classes); };

fmt.br=function() { return document.createElement('br'); };
fmt.tab=function() { return '&nbsp;&nbsp;&nbsp; '; };

fmt.whitespaces=function(text)
{
	return text.replace(/\n/g, '<br />').replace(/  /g, '&nbsp; ').replace(/\t/g, '&nbsp;&nbsp;&nbsp; ');
}
fmt.escape=function(text)
{
	return text.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, 'lt;');
};

function FormattedText()
{
	this.root=new FTEntry({ tag: 'div' });
	this.pointer=this.root;
}

function FTEntry(params)
{
	this.buffer=[];
	this.parent=params.parent || null;
	this.classes=params.classes || [];
	this.tagName=params.tag || 'div';
	if(params.content)
	{
		this.buffer.push(params.content);
	}
}
FTEntry.prototype.push=function(text)
{
	this.buffer.push(text);
	return this;
};

FormattedText.prototype.push=function(entry)
{
	if(entry.root) // FormattedText
	{
		entry.root.buffer.forEach(function(item){
			this.pointer.push(item);
		}, this);
	}
	else this.pointer.push(entry); // FTEntry
	return this;
};

FormattedText.prototype.startBlock=function(tag, classes)
{
	var block=new FTEntry({
		parent: this.pointer,
		tag: tag,
		classes: classes
	});
	this.pointer.push(block);
	this.pointer=block;
	return this;
};
FormattedText.prototype.endBlock=function()
{
	this.pointer=this.pointer.parent;
	return this;
};
FormattedText.prototype.endAll=function()
{
	this.pointer=this.root;
	return this;
};
FormattedText.prototype.startIndent=function()
{
	return this.startBlock('div', ['left-indent']);
};
FormattedText.prototype.startList=function()
{
	return this.startBlock('div', ['left-indent', 'comma-after']);
};

FormattedText.prototype.block=function(text, classes)
{
	this.pointer.push(new FTEntry({
		tag: 'div', parent: this,
		content: text, classes: classes
	}));
	return this;
};
FormattedText.prototype.number=function(text)
{
	this.pointer.push(new FTEntry({
		tag: 'span', parent: this,
		content: text, classes: ['number']
	}));
	return this;
};
FormattedText.prototype.string=function(text)
{
	this.pointer.push(new FTEntry({
		tag: 'span', parent: this,
		content: text, classes: ['string']
	}));
	return this;
};
FormattedText.prototype.bool=function(text)
{
	this.pointer.push(new FTEntry({
		tag: 'span', parent: this,
		content: text, classes: ['bool']
	}));
	return this;
};

FormattedText.prototype.bold=function(text)
{
	this.pointer.push(new FTEntry({
		tag: 'b', parent: this,
		content: text
	}));
	return this;
};
FormattedText.prototype.italic=function(text)
{
	this.pointer.push(new FTEntry({
		tag: 'i', parent: this,
		content: text
	}));
	return this;
};
FormattedText.prototype.underlined=function(text)
{
	this.pointer.push(new FTEntry({
		tag: 'u', parent: this,
		content: text
	}));
	return this;
};
FormattedText.prototype.plain=function(text)
{
	this.pointer.push(text);
	return this;
};
FormattedText.prototype.html=function(text)
{
	this.pointer.push({
		text: text,
		render: function()
		{
			var el=document.createElement('span');
			el.innerHTML=this.text;
			return el;
		}
	});
	return this;
};
FormattedText.prototype.br=function()
{
	this.pointer.push({
		render: function()
		{
			return document.createElement('br');
		}
	});
	return this;
};

FormattedText.prototype.render=function()
{
	return this.root.render();
};

FTEntry.prototype.render=function()
{
	var el=document.createElement(this.tagName);
	this.classes.forEach(function(item)
	{
		el.classList.add(item);
	});
	this.buffer.forEach(function(item)
	{
		if(typeof item == typeof '')
		{
			item=document.createTextNode(item);
		}
		else
		{
			item=item.render();
		}
		el.appendChild(item);
	});
	return el;
};
