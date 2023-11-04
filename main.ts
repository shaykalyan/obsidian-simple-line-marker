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
		// console.log('loading plugin')

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
		// console.log(`line text: ${line}`);

		const selection = editor.getSelection();
		let isSelection = false;
		// console.log(`selection: ${selection}`);

		if (selection.trim() != '') {
			isSelection = true;
			line = selection;
		}

		if (line.trim() == '') {
			// only whitespace, nothing to wrap
			return;
		}

		// console.log(`content to wrap: ${line}`);

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
		// console.log(`isWrapped: ${isWrapped}`);
		if (isWrapped) {
			const beforePrefixContent = content.slice(0, wrapPrefixIndex);
			const wrappedContent = content.slice(wrapPrefixIndex + wrapPrefix.length, wrapPostfixIndex);
			const afterPostfixContent = content.slice(wrapPostfixIndex + wrapPostfix.length);
			resolvedContent = beforePrefixContent + wrappedContent + afterPostfixContent;
		}
		else {
			const markdownTokenType = this.detectMarkdownTokenType(content);
			// console.log(markdownTokenType);
			let prefixedMarkdownContent = "";
			if (markdownTokenType.type != "paragraph") {
				prefixedMarkdownContent = content.slice(0, markdownTokenType.markdownTokenEndIndex + 1) + " ";
			}

			const contentToWrap = content.slice(markdownTokenType.markdownTokenEndIndex + 1).trim();
			resolvedContent = prefixedMarkdownContent + wrapPrefix + contentToWrap + wrapPostfix;
		}
		return resolvedContent;
	}

	onunload() {
		// console.log('unloading plugin')
	}

	detectMarkdownTokenType(lineText: string) {
		const bulletTokenMatchResult = lineText.match(/^[>]*\s*[*-]\s/);
		const checkboxTokenMatchResult = lineText.match(/[>]*^\s*[*-] \[[x ]\]/);
		const quoteTokenMatchIndex = lineText.match(/^\s*> /);

		// console.log(bulletTokenMatchResult);
		// console.log(checkboxTokenMatchResult);
		// console.log(quoteTokenMatchIndex);

		// checkbox should take precedence here over bullet for accurate determination
		if (checkboxTokenMatchResult != null) {
			return { type: 'checkbox', markdownTokenEndIndex: checkboxTokenMatchResult.index || 0 + checkboxTokenMatchResult[0].length - 1 };
		} else if (bulletTokenMatchResult != null) {
			return { type: 'bullet', markdownTokenEndIndex: bulletTokenMatchResult.index || 0 + bulletTokenMatchResult[0].length - 1 };
		} else if (quoteTokenMatchIndex != null) {
			return { type: 'quote', markdownTokenEndIndex: quoteTokenMatchIndex.index || 0 + quoteTokenMatchIndex[0].length - 1 };
		} else {
			return { type: 'paragraph', markdownTokenEndIndex: -1 };
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
