import { Button, Flex, HStack, IconButton } from "@chakra-ui/react";
import { FaCheck, FaTimes } from "react-icons/fa";

interface PracticeControlsProps {
	isFlipped: boolean;
	onFlip: () => void;
	onAnswer: (correct: boolean) => void;
}

function PracticeControls({
	isFlipped,
	onFlip,
	onAnswer,
}: PracticeControlsProps) {
	if (!isFlipped) {
		return (
			<Flex height="5rem" justifyContent="center" alignItems="center">
				<Button
					onClick={onFlip}
					borderRadius="sm"
					borderWidth="1px"
					boxShadow="sm"
					borderColor="bg.50"
					bg="bg.50"
					color="gray"
					_hover={{
						bg: "bg.100",
					}}
					_active={{
						bg: "bg.100",
					}}
				>
					Show Answer
				</Button>
			</Flex>
		);
	}

	return (
		<HStack gap={20} height="5rem">
			<IconButton
				aria-label="Don't Know"
				onClick={() => onAnswer(false)}
				rounded="full"
				size="2xl"
				bg="bg.50"
				borderWidth="1px"
				transition="all 0.4s"
				_hover={{
					transform: "scale(1.05)",
					bg: "bg.100",
				}}
				_active={{
					transform: "scale(1.05)",
					bg: "bg.100",
				}}
			>
				<FaTimes color="#eae9eb" />
			</IconButton>
			<IconButton
				aria-label="Know"
				onClick={() => onAnswer(true)}
				rounded="full"
				size="2xl"
				bg="bg.50"
				borderWidth="1px"
				transition="all 0.4s"
				_hover={{
					transform: "scale(1.05)",
					bg: "bg.100",
				}}
				_active={{
					transform: "scale(1.05)",
					bg: "bg.100",
				}}
			>
				<FaCheck color="#eae9eb" />
			</IconButton>
		</HStack>
	);
}

export default PracticeControls;
