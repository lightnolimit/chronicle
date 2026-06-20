// Append to ~/party-quest/convex/seed.ts on Spectre (see spectre/redeploy-party-quest-seed.sh).

export const seedChronicleDevelopment = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    partyId: v.optional(v.id("parties")),
    repoUrl: v.optional(v.string()),
    repoOwner: v.optional(v.string()),
    repoName: v.optional(v.string()),
    defaultBranch: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = args.sessionToken ? await requireAuth(ctx, args.sessionToken) : null;
    const allowLocalUnauthedSeed =
      process.env.CONVEX_AGENT_MODE === "anonymous" ||
      process.env.PARTY_QUEST_ALLOW_UNAUTH_DEMO_SEED === "1";
    if (!user && !allowLocalUnauthedSeed) {
      throw new Error("Pass a session token or enable local demo seeding explicitly.");
    }

    let partyId = args.partyId;
    let ownerId = user?._id;

    if (user) {
      const membership = args.partyId
        ? await ctx.db
            .query("partyMembers")
            .withIndex("by_party_user", (q) =>
              q.eq("partyId", args.partyId!).eq("userId", user._id),
            )
            .unique()
        : await ctx.db
            .query("partyMembers")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();
      if (!membership) {
        throw new Error("Create or join a party before seeding Chronicle Development.");
      }
      partyId = membership.partyId;
    }

    if (!partyId) {
      const firstParty = await ctx.db.query("parties").first();
      partyId = firstParty?._id;
      ownerId = firstParty?.ownerId;
    } else if (!ownerId) {
      const party = await ctx.db.get(partyId);
      ownerId = party?.ownerId;
    }

    if (!partyId || !ownerId) {
      throw new Error("Create a party before seeding Chronicle Development.");
    }

    const now = Date.now();
    const repoOwner = args.repoOwner?.trim() || "chronicle";
    const repoName = args.repoName?.trim() || "chronicle";
    const defaultBranch = args.defaultBranch?.trim() || "main";
    const repoUrl =
      args.repoUrl?.trim() || `https://forgejo.phantasy.bot/${repoOwner}/${repoName}`;
    const campaignSlug = "chronicle-development";

    const existing = await ctx.db
      .query("campaigns")
      .withIndex("by_party_slug", (q) =>
        q.eq("partyId", partyId).eq("slug", campaignSlug),
      )
      .first();

    let campaignId = existing?._id;
    let objectiveId = existing?.objectiveId;

    if (!campaignId || !objectiveId) {
      objectiveId = await ctx.db.insert("objectives", {
        partyId,
        ownerUserId: ownerId,
        title: "Chronicle Product Development",
        description:
          "Maintain Chronicle on Forgejo with shared Phantasy agent squads.",
        kind: "campaign_objective",
        status: "active",
        priority: "high",
        createdAt: now,
        updatedAt: now,
      });

      campaignId = await ctx.db.insert("campaigns", {
        partyId,
        objectiveId,
        createdBy: ownerId,
        title: "Chronicle Development",
        slug: campaignSlug,
        description: "Code, debug, marketing, and research for Chronicle.",
        repoProvider: "forgejo",
        repoOwner,
        repoName,
        defaultBranch,
        repoUrl,
        status: "active",
        priority: "high",
        createdAt: now,
        updatedAt: now,
      });
    }

    const squadSpecs = [
      {
        slug: "code",
        name: "Code",
        description: "Agent tests, API changes, and release hygiene.",
      },
      {
        slug: "debug",
        name: "Debug",
        description: "CI failures, flakes, and incident triage.",
      },
      {
        slug: "marketing",
        name: "Marketing",
        description: "Docs, product copy, and public documentation.",
      },
      {
        slug: "research",
        name: "Research",
        description: "Campaign health and integration research.",
      },
    ] as const;

    const squadIds = new Map<string, Id<"squads">>();
    for (const spec of squadSpecs) {
      const existingSquad = await ctx.db
        .query("squads")
        .withIndex("by_party_slug", (q) =>
          q.eq("partyId", partyId).eq("slug", spec.slug),
        )
        .first();
      if (existingSquad) {
        squadIds.set(spec.slug, existingSquad._id);
        continue;
      }
      const squadId = await ctx.db.insert("squads", {
        partyId,
        name: spec.name,
        slug: spec.slug,
        description: spec.description,
        createdAt: now,
        updatedAt: now,
      });
      squadIds.set(spec.slug, squadId);
    }

    const PHANTASY_SQUAD_AGENT_MAP = {
      code: { agentFrameworkId: "phantasy-opencode-agent", frameworkType: "opencode" },
      debug: { agentFrameworkId: "phantasy-openclaw-agent", frameworkType: "openclaw" },
      marketing: {
        agentFrameworkId: "phantasy-phantasy-agent",
        frameworkType: "phantasy",
      },
      research: { agentFrameworkId: "phantasy-hermes-agent", frameworkType: "hermes" },
    } as const;

    const resolveAgentByFrameworkId = async (agentFrameworkId: string) => {
      const callback = await ctx.db
        .query("agentCallbacks")
        .withIndex("by_framework_id", (q) => q.eq("agentFrameworkId", agentFrameworkId))
        .first();
      if (!callback) return null;
      const agent = await ctx.db.get(callback.agentId);
      if (!agent || agent.partyId !== partyId) return null;
      return agent;
    };

    let wiredSquadMembers = 0;
    for (const [squadSlug, mapping] of Object.entries(PHANTASY_SQUAD_AGENT_MAP)) {
      const squadId = squadIds.get(squadSlug);
      const agent = await resolveAgentByFrameworkId(mapping.agentFrameworkId);
      if (!squadId || !agent) continue;

      const existingMembership = await ctx.db
        .query("squadMembers")
        .withIndex("by_squad_agent", (q) =>
          q.eq("squadId", squadId).eq("agentId", agent._id),
        )
        .first();
      if (!existingMembership) {
        await ctx.db.insert("squadMembers", {
          squadId,
          agentId: agent._id,
          joinedAt: now,
          updatedAt: now,
        });
        wiredSquadMembers += 1;
      }

      await ctx.db.patch(agent._id, {
        frameworkType: mapping.frameworkType,
        updatedAt: now,
      });
    }

    const questSpecs = [
      {
        title: "Agent test suite",
        squad: "code",
        agentFrameworkId: "phantasy-opencode-agent",
        frameworkType: "opencode" as const,
        priority: "normal" as const,
        execution: {
          kind: "workflow",
          workflowPath: "npm run test --workspace=agent",
        },
        sourceRef: {
          provider: "forgejo" as const,
          kind: "repository" as const,
          repoOwner,
          repoName,
          branch: defaultBranch,
        },
      },
      {
        title: "Agent format check",
        squad: "marketing",
        agentFrameworkId: "phantasy-phantasy-agent",
        frameworkType: "phantasy" as const,
        priority: "normal" as const,
        execution: {
          kind: "workflow",
          workflowPath: "npm run format:check --workspace=agent",
        },
        sourceRef: {
          provider: "forgejo" as const,
          kind: "repository" as const,
          repoOwner,
          repoName,
          branch: defaultBranch,
        },
      },
      {
        title: "Forgejo CI failure response",
        squad: "debug",
        agentFrameworkId: "phantasy-openclaw-agent",
        frameworkType: "openclaw" as const,
        priority: "high" as const,
        sourceRef: {
          provider: "forgejo" as const,
          kind: "repository" as const,
          repoOwner,
          repoName,
          branch: defaultBranch,
        },
      },
      {
        title: "Forgejo mirror healthy",
        squad: "research",
        agentFrameworkId: "phantasy-hermes-agent",
        frameworkType: "hermes" as const,
        priority: "normal" as const,
        execution: {
          kind: "workflow",
          workflowPath:
            "FORGEJO_REPO=chronicle/chronicle node scripts/verify-forgejo-mirror.mjs",
        },
        sourceRef: {
          provider: "forgejo" as const,
          kind: "repository" as const,
          repoOwner,
          repoName,
          branch: defaultBranch,
        },
      },
    ];

    const existingQuests = await ctx.db
      .query("quests")
      .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId!))
      .collect();

    const activeTitles = new Set(questSpecs.map((spec) => spec.title));
    let archivedQuests = 0;
    for (const quest of existingQuests) {
      if (activeTitles.has(quest.title)) continue;
      await ctx.db.patch(quest._id, {
        status: "cancelled",
        claimedByAgentId: undefined,
        activeRunId: undefined,
        checkoutRunId: undefined,
        leaseExpiresAt: undefined,
        workspaceLockExpiresAt: undefined,
        nextClaimAt: undefined,
        updatedAt: now,
      });
      archivedQuests += 1;
    }

    let createdQuests = 0;
    let updatedQuests = 0;
    for (const [index, spec] of questSpecs.entries()) {
      const assignedAgent = await resolveAgentByFrameworkId(spec.agentFrameworkId);
      const squadId = squadIds.get(spec.squad);
      const existingQuest = existingQuests.find((quest) => quest.title === spec.title);

      if (existingQuest) {
        await ctx.db.patch(existingQuest._id, {
          squadId,
          assignedAgentId: assignedAgent?._id,
          requestedFrameworkType: spec.frameworkType,
          execution: spec.execution,
          autonomyMode: "hybrid",
          priority: spec.priority,
          status: "ready",
          claimedByAgentId: undefined,
          activeRunId: undefined,
          checkoutRunId: undefined,
          leaseExpiresAt: undefined,
          workspaceLockExpiresAt: undefined,
          nextClaimAt: undefined,
          updatedAt: now + index,
        });
        updatedQuests += 1;
        continue;
      }

      await ctx.db.insert("quests", {
        partyId,
        campaignId: campaignId!,
        squadId,
        createdBy: ownerId,
        assignedAgentId: assignedAgent?._id,
        title: spec.title,
        description: `Chronicle development lane: ${spec.title}`,
        type: "task",
        autonomyMode: "hybrid",
        status: "ready",
        priority: spec.priority,
        requestedFrameworkType: spec.frameworkType,
        execution: spec.execution,
        sourceRef: spec.sourceRef,
        retryCount: 0,
        createdAt: now + index,
        updatedAt: now + index,
      });
      createdQuests += 1;
    }

    return {
      created: !existing,
      partyId,
      campaignId,
      squadCount: squadIds.size,
      wiredSquadMembers,
      createdQuests,
      updatedQuests,
      archivedQuests,
      repoUrl,
    };
  },
});