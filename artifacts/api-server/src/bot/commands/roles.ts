import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

export const commands = [
  {
    data: new SlashCommandBuilder()
      .setName("addrole")
      .setDescription("Add a role to a member")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true))
      .addRoleOption((o) => o.setName("role").setDescription("Role to add").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
        await interaction.reply({ content: "You don't have permission.", ephemeral: true }); return;
      }
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      await interaction.deferReply();
      const user = interaction.options.getUser("user", true);
      const role = interaction.options.getRole("role", true);
      let member;
      try { member = await guild.members.fetch(user.id); } catch { await interaction.editReply("User not in server."); return; }
      await member.roles.add(role.id);
      await interaction.editReply(`✅ Added **${role.name}** to ${user.tag}.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("removerole")
      .setDescription("Remove a role from a member")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true))
      .addRoleOption((o) => o.setName("role").setDescription("Role to remove").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
        await interaction.reply({ content: "You don't have permission.", ephemeral: true }); return;
      }
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      await interaction.deferReply();
      const user = interaction.options.getUser("user", true);
      const role = interaction.options.getRole("role", true);
      let member;
      try { member = await guild.members.fetch(user.id); } catch { await interaction.editReply("User not in server."); return; }
      await member.roles.remove(role.id);
      await interaction.editReply(`✅ Removed **${role.name}** from ${user.tag}.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("createrole")
      .setDescription("Create a new role")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .addStringOption((o) => o.setName("name").setDescription("Role name").setRequired(true))
      .addStringOption((o) => o.setName("color").setDescription("Hex color (e.g. #ff0000)").setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
        await interaction.reply({ content: "You don't have permission.", ephemeral: true }); return;
      }
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      await interaction.deferReply();
      const name = interaction.options.getString("name", true);
      const colorStr = interaction.options.getString("color");
      const color = colorStr ? (parseInt(colorStr.replace("#", ""), 16) as `#${string}` | number) : undefined;
      const role = await guild.roles.create({ name, color: color as number | undefined });
      await interaction.editReply(`✅ Created role **${role.name}** (ID: ${role.id}).`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("deleterole")
      .setDescription("Delete a role")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .addRoleOption((o) => o.setName("role").setDescription("Role to delete").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
        await interaction.reply({ content: "You don't have permission.", ephemeral: true }); return;
      }
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      await interaction.deferReply();
      const role = interaction.options.getRole("role", true);
      await guild.roles.delete(role.id);
      await interaction.editReply(`✅ Deleted role **${role.name}**.`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("roleinfo")
      .setDescription("Get info about a role")
      .addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const rawRole = interaction.options.getRole("role", true);
      const guild = interaction.guild;
      const role = guild ? guild.roles.cache.get(rawRole.id) : null;
      const embed = new EmbedBuilder()
        .setTitle(`Role: ${rawRole.name}`)
        .setColor((rawRole.color as number) || 0x5865f2)
        .addFields(
          { name: "ID", value: rawRole.id, inline: true },
          { name: "Color", value: role ? role.hexColor : rawRole.color.toString(), inline: true },
          { name: "Mentionable", value: rawRole.mentionable ? "Yes" : "No", inline: true },
          { name: "Hoisted", value: rawRole.hoist ? "Yes" : "No", inline: true },
          { name: "Created", value: role ? `<t:${Math.floor(role.createdTimestamp / 1000)}:R>` : "Unknown", inline: true }
        );
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("rolemembers")
      .setDescription("List members with a specific role")
      .addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) { await interaction.reply({ content: "Server only.", ephemeral: true }); return; }
      await interaction.deferReply();
      const role = interaction.options.getRole("role", true);
      await guild.members.fetch();
      const guildRole = guild.roles.cache.get(role.id);
      if (!guildRole) { await interaction.editReply("Role not found."); return; }
      const members = guildRole.members;
      const list = members.map((m) => m.user.tag).slice(0, 30).join("\n");
      const embed = new EmbedBuilder()
        .setTitle(`Members with @${role.name} (${members.size})`)
        .setDescription(list || "No members with this role.")
        .setColor((guildRole.color as number) || 0x5865f2);
      if (members.size > 30) embed.setFooter({ text: `Showing 30 of ${members.size}` });
      await interaction.editReply({ embeds: [embed] });
    },
  },
];
