from app.models import Space


def generate_image_prompt(space: Space) -> str:
    equipment = ", ".join(item.name for item in space.equipment) or "premium office essentials"
    type_label = "hot desk" if space.type.value == "hot_desk" else "meeting room"
    prompt = (
        f"Create a realistic premium office interior preview image for a {type_label} called '{space.name}' "
        f"in the {space.zone}. The space fits {space.capacity} people and includes {equipment}. "
        "Apple-inspired corporate office design, dark mode visual style, realistic photography."
    )
    # TODO: Integrate AWS Bedrock image generation here later. Store generated images in S3
    # and save the resulting HTTPS object URL to Space.image_url.
    return prompt
