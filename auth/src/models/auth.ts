import { DataTypes, Model, Optional } from "sequelize";
import { sequelizeConnection } from "./connection";

interface AuthCheckAttribute {
  key: string;
  value: string;
}

interface AuthAttributes {
  id: string;
  name: string;
  jwkUrl: string;
  verifier: string;
  checks: AuthCheckAttribute[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface AuthInput extends Optional<AuthAttributes, "id"> {}

export class Auth extends Model implements AuthAttributes
{
  public id!: string;
  public name!: string;
  public jwkUrl!: string;
  public verifier!: string;
  public checks!: AuthCheckAttribute[];

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

Auth.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jwkUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    verifier: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    checks: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
  },
  {
    tableName: "auth",
    paranoid: true,
    timestamps: true,
    sequelize: sequelizeConnection,
  },
);
