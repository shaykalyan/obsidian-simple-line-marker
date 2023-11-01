import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface SimpleLineMarkerSettings {
	mySetting: string;
	customTags: string[];
}

const DEFAULT_SETTINGS: SimpleLineMarkerSettings = {
	mySetting: 'default',
	customTags: [],
}

export default class SimpleLineMarkerPlugin extends Plugin {
	settings: SimpleLineMarkerSettings;

	async onload() {
		await this.loadSettings();
		console.log('loading plugin')

		this.addCommand({
			id: 'simple-line-marker-toggle-highlight',
			name: 'Toggle Highlight',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const wrapPrefix = '==';
				const wrapPostfix = '==';
				this.handleWrapCommand(editor, view, wrapPrefix, wrapPostfix);
			}
		});

		// this.addCommand({
		// 	id: 'simple-highlight-toggle-faint',
		// 	name: 'Toggle Faint Text',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		const wrapPrefix = '<span class="faint-text">';
		// 		const wrapPrefixIndentifyingSubstring = '<span class';
		// 		const wrapPostfix = '</span>';
		// 		this.handleWrapCommand(editor, view, wrapPrefix, wrapPostfix, wrapPrefixIndentifyingSubstring);
		// 	}
		// });

		this.addCommand({
			id: 'simple-line-marker-toggle-orange',
			name: 'Toggle 🟠',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const wrapPrefix = '🟠 ';
				const wrapPostfix = '';
				this.handleWrapCommand(editor, view, wrapPrefix, wrapPostfix);
			}
		});

		this.addCommand({
			id: 'simple-line-marker-toggle-red',
			name: 'Toggle 🔴',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const wrapPrefix = '🔴 ';
				const wrapPostfix = '';
				this.handleWrapCommand(editor, view, wrapPrefix, wrapPostfix);
			}
		});

		this.addCommand({
			id: 'simple-line-marker-toggle-green',
			name: 'Toggle 🟢',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const wrapPrefix = '🟢 ';
				const wrapPostfix = '';
				this.handleWrapCommand(editor, view, wrapPrefix, wrapPostfix);
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	private handleWrapCommand(editor: Editor, view: MarkdownView, wrapPrefix: string, wrapPostfix: string, wrapPrefixIndentifyingSubstring?: string) {
		const cursor = editor.getCursor();
		const lineNumber = cursor.line;
		let line = editor.getLine(lineNumber);
		console.log(`line text: ${line}`);

		const selection = editor.getSelection();
		let isSelection = false;
		console.log(`selection: ${selection}`);

		if (selection.trim() != '') {
			isSelection = true;
			line = selection;
		}

		if (line.trim() == '') {
			// only whitespace, nothing to wrap
			return;
		}

		console.log(`content to wrap: ${line}`);

		const wrappedLine = this.toggleContentWrap(line, wrapPrefix, wrapPostfix, wrapPrefixIndentifyingSubstring);

		if (isSelection) {
			editor.replaceSelection(wrappedLine);
		}
		else {
			editor.setLine(lineNumber, wrappedLine);
		}
	}

	private toggleContentWrap(content: string, wrapPrefix: string, wrapPostfix: string, wrapPrefixIndentifyingSubstring?: string) {
		const wrapPrefixIndex = content.indexOf(wrapPrefixIndentifyingSubstring || wrapPrefix);
		const wrapPostfixIndex = content.lastIndexOf(wrapPostfix);
		const isWrapped = wrapPrefixIndex != -1 &&
			wrapPostfixIndex != -1 &&
			wrapPrefixIndex != wrapPostfixIndex;

		let resolvedContent = content;
		console.log(`isWrapped: ${isWrapped}`);
		if (isWrapped) {
			const beforePrefixContent = content.slice(0, wrapPrefixIndex);
			const wrappedContent = content.slice(wrapPrefixIndex + wrapPrefix.length, wrapPostfixIndex);
			const afterPostfixContent = content.slice(wrapPostfixIndex + wrapPostfix.length);
			resolvedContent = beforePrefixContent + wrappedContent + afterPostfixContent;
		}
		else {
			const markdownType = this.detectMarkdownType(content);
			// console.log(markdownType);
			let prefixedMarkdownContent = "";
			if (markdownType.type != "paragraph") {
				prefixedMarkdownContent = content.slice(0, markdownType.index + 1) + " ";
			}

			const contentToWrap = content.slice(markdownType.index + 1).trim();
			resolvedContent = prefixedMarkdownContent + wrapPrefix + contentToWrap + wrapPostfix;
		}
		return resolvedContent;
	}

	onunload() {
		console.log('unloading plugin')
	}

	detectMarkdownType(lineText: string) {
		const bulletIndex = lineText.match(/^\s*[*-]\s/);
		const checkboxIndex = lineText.match(/^\s*- \[[x ]\]/);
		const quoteIndex = lineText.match(/^\s*> /);

		// console.log(bulletIndex);
		// console.log(checkboxIndex);
		// console.log(quoteIndex);

		if (bulletIndex != null) {
			return { type: 'bullet', index: bulletIndex.index || 0 + bulletIndex[0].length - 1 };
		} else if (checkboxIndex != null) {
			return { type: 'checkbox', index: checkboxIndex.index || 0 + checkboxIndex[0].length - 1 };
		} else if (quoteIndex != null) {
			return { type: 'quote', index: quoteIndex.index || 0 + quoteIndex[0].length - 1 };
		} else {
			return { type: 'paragraph', index: -1 };
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SimpleLineMarkerSettingTab extends PluginSettingTab {
	plugin: SimpleLineMarkerPlugin;

	constructor(app: App, plugin: SimpleLineMarkerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
