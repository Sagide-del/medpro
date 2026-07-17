import { query } from '../config/database.js';

export const ElibraryResource = {

  async list({
    status = 'published',
    category,
    search,
    resourceType,
    limit = 50,
    offset = 0
  } = {}) {

    const conditions = [];
    const params = [];
    let i = 1;

    if (status) {
      conditions.push(`status = $${i++}`);
      params.push(status);
    }

    if (category) {
      conditions.push(`category = $${i++}`);
      params.push(category);
    }

    if (resourceType) {
      conditions.push(`resource_type = $${i++}`);
      params.push(resourceType);
    }

    if (search) {
      conditions.push(
        `(title ILIKE $${i} OR description ILIKE $${i} OR author ILIKE $${i})`
      );
      params.push(`%${search}%`);
      i++;
    }


    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';


    const { rows } = await query(
      `
      SELECT *
      FROM elibrary_resources
      ${where}
      ORDER BY created_at DESC
      LIMIT $${i++}
      OFFSET $${i++}
      `,
      [
        ...params,
        limit,
        offset
      ]
    );


    return rows;
  },


  async findById(resourceId) {

    const { rows } = await query(
      `
      SELECT *
      FROM elibrary_resources
      WHERE resource_id = $1
      `,
      [resourceId]
    );

    return rows[0] || null;
  },


  async create({
    title,
    description,
    category,
    author,
    price = 20,
    isPremium = true,
    resourceType = 'ebook',
    journal,
    publicationYear,
    doi,
    externalUrl,
    learningObjectives,
    evidenceLevel,
    uploadedBy
  }) {


    const { rows } = await query(
      `
      INSERT INTO elibrary_resources
      (
        title,
        description,
        category,
        author,
        price,
        is_premium,
        resource_type,
        journal,
        publication_year,
        doi,
        external_url,
        learning_objectives,
        evidence_level,
        uploaded_by
      )

      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
      )

      RETURNING *
      `,
      [
        title,
        description || null,
        category || null,
        author || null,
        price,
        isPremium,
        resourceType,
        journal || null,
        publicationYear || null,
        doi || null,
        externalUrl || null,
        learningObjectives || null,
        evidenceLevel || null,
        uploadedBy
      ]
    );


    return rows[0];
  },


  async update(resourceId, data) {

    const {
      title,
      description,
      category,
      author,
      price,
      resourceType,
      journal,
      publicationYear,
      doi,
      externalUrl,
      learningObjectives,
      evidenceLevel
    } = data;


    const { rows } = await query(
      `
      UPDATE elibrary_resources

      SET
      title = COALESCE($1,title),
      description = COALESCE($2,description),
      category = COALESCE($3,category),
      author = COALESCE($4,author),
      price = COALESCE($5,price),
      resource_type = COALESCE($6,resource_type),
      journal = COALESCE($7,journal),
      publication_year = COALESCE($8,publication_year),
      doi = COALESCE($9,doi),
      external_url = COALESCE($10,external_url),
      learning_objectives = COALESCE($11,learning_objectives),
      evidence_level = COALESCE($12,evidence_level)

      WHERE resource_id = $13

      RETURNING *
      `,
      [
        title,
        description,
        category,
        author,
        price,
        resourceType,
        journal,
        publicationYear,
        doi,
        externalUrl,
        learningObjectives,
        evidenceLevel,
        resourceId
      ]
    );


    return rows[0];
  },


  async setFiles(resourceId,{fileUrl,thumbnailUrl}) {

    const { rows } = await query(
      `
      UPDATE elibrary_resources

      SET
      file_url = COALESCE($1,file_url),
      thumbnail_url = COALESCE($2,thumbnail_url)

      WHERE resource_id=$3

      RETURNING *
      `,
      [
        fileUrl || null,
        thumbnailUrl || null,
        resourceId
      ]
    );


    return rows[0];
  },


  async setStatus(resourceId,status){

    const { rows } = await query(
      `
      UPDATE elibrary_resources
      SET status=$1
      WHERE resource_id=$2
      RETURNING *
      `,
      [
        status,
        resourceId
      ]
    );


    return rows[0];
  },


  async incrementDownloads(resourceId){

    await query(
      `
      UPDATE elibrary_resources
      SET download_count = download_count + 1
      WHERE resource_id=$1
      `,
      [
        resourceId
      ]
    );
  },


  async incrementPurchases(resourceId){

    await this.incrementDownloads(resourceId);

  },


  async delete(resourceId){

    await query(
      `
      DELETE FROM elibrary_resources
      WHERE resource_id=$1
      `,
      [
        resourceId
      ]
    );

  }

};