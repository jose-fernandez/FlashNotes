import {
	DialogActionTrigger,
	DialogBody,
	DialogCloseTrigger,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogRoot,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Text } from "@chakra-ui/react";
import { useRef, useState } from "react";
import { BlueButton, RedButton } from "../commonUI/Button";
import { DefaultInput } from "../commonUI/Input";

interface AiCollectionDialogProps {
	onAddAi: (prompt: string) => Promise<void>;
	children: React.ReactNode;
}

const MAX_CHARS = 100;

const AiCollectionDialog: React.FC<AiCollectionDialogProps> = ({
	onAddAi,
	children,
}) => {
	const [prompt, setPrompt] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	const handleSubmit = async () => {
		if (!prompt.trim()) return;

		try {
			setIsLoading(true);
			closeButtonRef.current?.click();
			await onAddAi(prompt);
			setPrompt("");
		} catch (error) {
			console.error("Failed to create AI collection:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<DialogRoot
			key="add-ai-collection-dialog"
			placement="center"
			motionPreset="slide-in-bottom"
		>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent bg="bg.50">
				<DialogHeader>
					<DialogTitle color="fg.DEFAULT">Create AI Collection</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<DefaultInput
						disabled={isLoading}
						placeholder="Enter a topic or concept (e.g., 'Quantum Physics', 'Spanish Verbs')"
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						maxLength={MAX_CHARS}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !isLoading) {
								e.preventDefault();
								handleSubmit();
							}
						}}
					/>
					<Text fontSize="xs" textAlign="right" color="gray.500" mt={1}>
						{prompt.length}/{MAX_CHARS}
					</Text>
				</DialogBody>
				<DialogFooter>
					<DialogActionTrigger asChild>
						<RedButton onClick={() => setPrompt("")} disabled={isLoading}>
							Cancel
						</RedButton>
					</DialogActionTrigger>
					<DialogActionTrigger asChild>
						<BlueButton onClick={handleSubmit} disabled={isLoading}>
							{isLoading ? "Creating..." : "Create"}
						</BlueButton>
					</DialogActionTrigger>
				</DialogFooter>
				<DialogCloseTrigger ref={closeButtonRef} />
			</DialogContent>
		</DialogRoot>
	);
};

export default AiCollectionDialog;
