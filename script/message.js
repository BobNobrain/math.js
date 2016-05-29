function MessageBox(params)
{
	this.title=params.title;
	this.content=params.content;
	this.actions=params.actions;
	this.element=null;
}

MessageBox.prototype.renderContent=function()
{
	if(typeof this.content.render == typeof eval)
	{
		return this.content.render();
	}
	var p=document.createElement('p');
	p.innerHTML=this.content;
	return p;
};

MessageBox.prototype.build=function()
{
	var back=document.createElement('div');
	back.classList.add('msg-background');

	back.addEventListener('click', (function() { this.close(); }).bind(this));

	var container=document.createElement('div');
	container.classList.add('msg');

	container.addEventListener('click', function(ev) { ev.stopPropagation(); });

	var title=document.createElement('h2');
	title.innerHTML=this.title;

	var content=document.createElement('div');
	content.classList.add('content');
	content.innerHTML=this.content;

	var footer=document.createElement('div');
	footer.classList.add('actions');

	var actions=Object.getOwnPropertyNames(this.actions).map(function(item)
	{
		return [item, this.actions[item]];
	},this);

	actions.forEach(function(item)
	{
		var button=document.createElement('button');
		button.setAttribute('type', 'button');
		button.innerHTML=item[0];
		button.addEventListener('click', item[1].bind(this));
		footer.appendChild(button);
	}, this);

	container.appendChild(title);
	container.appendChild(content);
	container.appendChild(footer);

	back.appendChild(container);
	return back;
};

MessageBox.prototype.show=function()
{
	if(this.element===null) this.element=this.build();
	this.element.classList.add('active');
	window.elements.messageContainer.appendChild(this.element);
};
MessageBox.prototype.setVisible=function(show)
{
	this.element.classList[show? 'add':'remove']('active');
};
MessageBox.prototype.close=function()
{
	window.elements.messageContainer.removeChild(this.element);
};

MessageBox.defaultActions={
	'Close': function() { this.close(); }
};

MessageBox.alert=function(text, title)
{
	title = title || 'Message';
	var m=new MessageBox({
		title: title, content: text,
		actions: MessageBox.defaultActions
	});
	m.show();
	return m;
};
