'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const alertTemplates = [
	{
		id: 1,
		type: 'Tsunami Warning',
		severity: 'critical',
		template: 'Tsunami warning for [region]. Immediate evacuation required. Wave height: [height]m. ETA: [time].',
		icon: '🌊',
	},
	{
		id: 2,
		type: 'Storm Surge',
		severity: 'high',
		template: 'Storm surge alert for [region]. Expected surge height: [height]m. Secure coastal areas.',
		icon: '🌪',
	},
	{
		id: 3,
		type: 'High Waves',
		severity: 'medium',
		template: 'High wave warning for [region] coastline. Wave height: [height]m. Avoid beach activities.',
		icon: '🌊',
	},
	{
		id: 4,
		type: 'Coastal Flooding',
		severity: 'high',
		template: 'Coastal flood warning for [region]. Expected duration: [time]. Move to higher ground.',
		icon: '🌧',
	},
];

const regions = [
	'Tamil Nadu Coast',
	'Kerala Coast',
	'Andhra Coast',
	'Gujarat Coast',
	'Maharashtra Coast',
	'Odisha Coast',
	'West Bengal Coast',
];

export default function EmergencyAlertPanel() {
	const [selectedTemplate, setSelectedTemplate] = useState(null);
	const [selectedRegion, setSelectedRegion] = useState('');
	const [customMessage, setCustomMessage] = useState('');
	const [isPreview, setIsPreview] = useState(false);

	const handleTemplateSelect = (template) => {
		setSelectedTemplate(template);
		if (selectedRegion) {
			const newMessage = template.template.replace('[region]', selectedRegion);
			setCustomMessage(newMessage);
		} else {
			setCustomMessage(template.template);
		}
	};

	const handleRegionSelect = (region) => {
		setSelectedRegion(region);
		if (selectedTemplate) {
			const newMessage = selectedTemplate.template.replace('[region]', region);
			setCustomMessage(newMessage);
		}
	};

	const handleBroadcast = () => {
		// TODO: Implement actual broadcast logic
		console.log({
			message: customMessage,
			region: selectedRegion,
			severity: selectedTemplate?.severity,
			timestamp: new Date().toISOString(),
		});
	};

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-xl font-semibold text-white">Emergency Alert System</h2>
				<button
					onClick={() => setIsPreview(!isPreview)}
					className="px-4 py-2 text-sm bg-slate-700/50 text-white rounded-md hover:bg-slate-700"
				>
					{isPreview ? 'Edit Alert' : 'Preview'}
				</button>
			</div>

			<AnimatePresence mode="wait">
				{!isPreview ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="space-y-6"
					>
						{/* Region Selection - Moved to top */}
						<div className="space-y-2">
							<h3 className="text-white font-medium mb-3">Select Target Region</h3>
							<div className="grid grid-cols-2 gap-2">
								{regions.map((region) => (
									<button
										key={region}
										onClick={() => handleRegionSelect(region)}
										className={`px-4 py-2 rounded-lg text-sm transition-colors ${
											selectedRegion === region
												? 'bg-blue-500 text-white'
												: 'bg-slate-800/50 text-slate-300 border border-slate-700 hover:bg-slate-700/50'
										}`}
									>
										{region}
									</button>
								))}
							</div>
						</div>

						{/* Quick Action Templates */}
						{selectedRegion && (
							<div className="space-y-4">
								<h3 className="text-white font-medium">Select Alert Type</h3>
								<div className="grid grid-cols-2 gap-4">
									{alertTemplates.map((template) => (
										<motion.button
											key={template.id}
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											onClick={() => handleTemplateSelect(template)}
											className={`p-4 rounded-lg border text-left transition-colors ${
												selectedTemplate?.id === template.id
													? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
													: 'bg-slate-800/50 border-slate-700 text-slate-300'
											}`}
										>
											<div className="text-2xl mb-2">{template.icon}</div>
											<h3 className="font-medium">{template.type}</h3>
											<div
												className={`text-sm mt-1 ${
													template.severity === 'critical'
														? 'text-red-400'
														: template.severity === 'high'
														? 'text-orange-400'
														: 'text-yellow-400'
												}`}
											>
												{template.severity.toUpperCase()}
											</div>
										</motion.button>
									))}
								</div>
							</div>
						)}

						{/* Message Customization */}
						{selectedTemplate && selectedRegion && (
							<div className="space-y-4">
								<h3 className="text-white font-medium">Customize Message</h3>
								<textarea
									value={customMessage}
									onChange={(e) => setCustomMessage(e.target.value)}
									className="w-full h-32 bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-white"
									placeholder="Customize alert message..."
								/>
							</div>
						)}
					</motion.div>
				) : (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="bg-slate-800/50 p-6 rounded-lg border border-slate-700"
					>
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								{selectedTemplate?.icon}
								<span
									className={`px-2 py-1 rounded text-sm ${
										selectedTemplate?.severity === 'critical'
											? 'bg-red-500/20 text-red-400'
											: selectedTemplate?.severity === 'high'
											? 'bg-orange-500/20 text-orange-400'
											: 'bg-yellow-500/20 text-yellow-400'
									}`}
								>
									{selectedTemplate?.severity.toUpperCase()}
								</span>
							</div>
							<p className="text-white text-lg">{customMessage}</p>
							<div className="mt-4">
								<span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
									{selectedRegion}
								</span>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<div className="mt-6">
				<button
					onClick={handleBroadcast}
					disabled={!selectedTemplate || !selectedRegion}
					className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Broadcast Emergency Alert
				</button>
			</div>
		</div>
	);
}