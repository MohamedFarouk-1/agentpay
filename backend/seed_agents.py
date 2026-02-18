"""
Seed script to populate the database with sample AI agents
Run this after starting the backend to add agents to the marketplace
"""
import asyncio
import sys
from decimal import Decimal
from app.database import AsyncSessionLocal
from app.models.agent import Agent


async def seed_agents():
    """Add sample AI agents to the database"""

    sample_agents = [
        {
            "name": "ResearchGPT",
            "wallet_address": "0x1234567890123456789012345678901234567890",
            "price": Decimal("25.00"),
            "description": "Autonomous research agent that gathers, analyzes, and summarizes information from multiple sources. Perfect for market research and competitive analysis.",
            "image_url": "https://via.placeholder.com/400x300?text=ResearchGPT",
            "is_active": True,
        },
        {
            "name": "DataAnalyzer Pro",
            "wallet_address": "0x2345678901234567890123456789012345678901",
            "price": Decimal("50.00"),
            "description": "Advanced data analysis agent with machine learning capabilities. Processes large datasets and generates actionable insights automatically.",
            "image_url": "https://via.placeholder.com/400x300?text=DataAnalyzer",
            "is_active": True,
        },
        {
            "name": "ContentCreator AI",
            "wallet_address": "0x3456789012345678901234567890123456789012",
            "price": Decimal("30.00"),
            "description": "Creative writing agent for blog posts, social media, and marketing copy. Maintains brand voice and generates SEO-optimized content.",
            "image_url": "https://via.placeholder.com/400x300?text=ContentCreator",
            "is_active": True,
        },
        {
            "name": "CodeAssistant",
            "wallet_address": "0x4567890123456789012345678901234567890123",
            "price": Decimal("75.00"),
            "description": "AI coding assistant that writes, reviews, and debugs code across multiple languages. Integrates with GitHub for automated PR reviews.",
            "image_url": "https://via.placeholder.com/400x300?text=CodeAssistant",
            "is_active": True,
        },
        {
            "name": "CustomerSupport Bot",
            "wallet_address": "0x5678901234567890123456789012345678901234",
            "price": Decimal("40.00"),
            "description": "24/7 customer support agent with natural language understanding. Handles inquiries, escalates complex issues, and maintains conversation context.",
            "image_url": "https://via.placeholder.com/400x300?text=CustomerSupport",
            "is_active": True,
        },
    ]

    async with AsyncSessionLocal() as session:
        try:
            # Add all agents
            for agent_data in sample_agents:
                agent = Agent(**agent_data)
                session.add(agent)

            await session.commit()
            print(f"✅ Successfully added {len(sample_agents)} sample AI agents to the database!")

            # Print agent details
            print("\n📋 Sample AI Agents:")
            print("-" * 80)
            for agent_data in sample_agents:
                print(f"  • {agent_data['name']}")
                print(f"    Price: ${agent_data['price']}")
                print(f"    Wallet: {agent_data['wallet_address']}")
                print()

        except Exception as e:
            print(f"❌ Error seeding agents: {e}")
            await session.rollback()
            sys.exit(1)


if __name__ == "__main__":
    print("🌱 Seeding database with sample AI agents...")
    asyncio.run(seed_agents())
