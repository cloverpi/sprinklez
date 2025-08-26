// Keyboard Layout Detection Utility
export class KeyboardLayoutDetector {
	constructor() {
		this.detectedLayout = null
		this.testComplete = false
		this.callbacks = []
	}

	// Register callback for layout changes
	onLayoutChange(callback) {
		this.callbacks.push(callback)
	}

	// Notify all callbacks of layout change
	notifyLayoutChange(layout) {
		console.log(`Notifying ${this.callbacks.length} callbacks of layout change to: ${layout}`)
		this.callbacks.forEach(callback => {
			try {
				callback(layout)
			} catch (e) {
				console.error('Error in layout change callback:', e)
			}
		})
	}

	// Test keyboard layout by listening for real key events during gameplay
	async detectLayout() {
		if (this.testComplete && this.detectedLayout) {
			return this.detectedLayout
		}

		return new Promise((resolve) => {
			let layoutDetected = false
			let keyTestCount = 0
			const maxTests = 5

			const cleanup = () => {
				document.removeEventListener('keydown', testKeyHandler, true)
				this.testComplete = true
				resolve(this.detectedLayout || this.getFallbackLayout())
			}

			const testKeyHandler = (e) => {
				keyTestCount++
				console.log(`Tested key: code=${e.code}, key=${e.key}`)

				// Test QWERTY W position (should be 'z' on AZERTY)
				if (e.code === 'KeyW' && e.key.toLowerCase() === 'z') {
					console.log('Detected AZERTY layout (W->Z)')
					this.detectedLayout = 'azerty'
					layoutDetected = true
					this.notifyLayoutChange('azerty')
					cleanup()
					return
				}

				// Test QWERTY A position (should be 'q' on AZERTY)
				if (e.code === 'KeyA' && e.key.toLowerCase() === 'q') {
					console.log('Detected AZERTY layout (A->Q)')
					this.detectedLayout = 'azerty'
					layoutDetected = true
					this.notifyLayoutChange('azerty')
					cleanup()
					return
				}

				// Standard QWERTY response
				if (
					(e.code === 'KeyW' && e.key.toLowerCase() === 'w') ||
					(e.code === 'KeyA' && e.key.toLowerCase() === 'a') ||
					(e.code === 'KeyS' && e.key.toLowerCase() === 's') ||
					(e.code === 'KeyD' && e.key.toLowerCase() === 'd')
				) {
					console.log('Detected QWERTY layout')
					this.detectedLayout = 'qwerty'
					layoutDetected = true
					this.notifyLayoutChange('qwerty')
					cleanup()
					return
				}

				// If we've tested enough keys without clear detection, use fallback
				if (keyTestCount >= maxTests) {
					console.log('Using fallback layout detection')
					this.detectedLayout = this.getFallbackLayout()
					cleanup()
				}
			}

			// Use capture phase to catch all keydown events
			document.addEventListener('keydown', testKeyHandler, true)

			// Auto-cleanup after 30 seconds if no keys pressed
			setTimeout(() => {
				if (!layoutDetected) {
					console.log('Timeout reached, using fallback layout')
					this.detectedLayout = this.getFallbackLayout()
					cleanup()
				}
			}, 30000)

			// Also resolve immediately with fallback, but keep listening for better detection
			setTimeout(() => {
				if (!layoutDetected) {
					resolve(this.getFallbackLayout())
				}
			}, 100)
		})
	}

	getFallbackLayout() {
		// Fallback to browser language detection
		const lang = navigator.language || navigator.userLanguage || 'en'
		const azertyLanguages = ['fr', 'be', 'fr-BE', 'fr-FR', 'fr-CA']
		const result = azertyLanguages.some((l) => lang.toLowerCase().startsWith(l.toLowerCase()))
			? 'azerty'
			: 'qwerty'
		console.log(`Fallback layout detection: lang=${lang}, result=${result}`)
		return result
	}

	// Get immediate layout (uses cached result or fallback)
	getLayoutSync() {
		return this.detectedLayout || this.getFallbackLayout()
	}
}

// Key mapping utilities
export const KeyMappings = {
	movement: {
		qwerty: {
			up: 'W',
			left: 'A',
			down: 'S',
			right: 'D',
		},
		azerty: {
			up: 'Z',
			left: 'Q',
			down: 'S',
			right: 'D',
		},
	},
	abilities: {
		qwerty: ['1', '2', '3', '4'],
		azerty: ['&', 'é', '"', "'"],
	},
	getMovementKeys(layout) {
		const mapping = this.movement[layout] || this.movement.qwerty
		return [mapping.up, mapping.left, mapping.down, mapping.right]
	},
	getAbilityKeys(layout) {
		return this.abilities[layout] || this.abilities.qwerty
	},
	getLayoutDisplayName(layout) {
		return layout === 'azerty' ? 'AZERTY' : 'QWERTY'
	},
}

// Global detector instance
export const layoutDetector = new KeyboardLayoutDetector()

// Start detection immediately when module loads
console.log('Keyboard layout detector initializing...')
layoutDetector.detectLayout().then(layout => {
	console.log(`Final detected layout: ${layout}`)
})
